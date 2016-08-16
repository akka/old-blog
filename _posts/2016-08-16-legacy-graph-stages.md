---
layout: post
title: "Writing Akka Stream Connectors for existing APIs"
description: ""
author: Johan Andrén
category: integrations
tags: [streams,connectors,integration]
---
{% include JB/setup %}

Writing an integration from ground up can be daunting and will be an expensive solution to maintain over time. Luckily there often is no need to start from zero: the Java ecosystem is rich and if there is something to connect to there often is a library to interface with it already available. With Akka Streams wrapping such APIs to provide an easy way to include them in asynchronous back pressured streams. Let’s take a look at a few different scenarios and how source and sink graph stages can be written for each.

## Asynchronous callbacks
Some libraries already have asynchronous APIs and allows a user to register a callback of some sort to react on data arriving or a write completing.

Graph stages–very much like Actors–are maintaining the single threaded illusion, meaning that inside a `GraphStageLogic` instance we do not have to deal with concurrency primitives and can safely keep mutable state.

When dealing with callbacks there is however one problem, we often do not have any control over what thread the callback is executed on, meaning that it is not safe to touch the internal state of the GraphStageLogic, we need to first get the message into the execution context of the stream. This is done by acquiring an instance of `AsyncCallback`, which will safely invoke a callback that is able to access state of the `GraphStageLogic` instance.

### FileTailSource
This sample code is taken from the [FileTailSource] sources of the [Akka Stream Contrib project](https://github.com/akka/akka-stream-contrib). In this case we are reading chunks of bytes from a file, but not stopping and completing the stream when we reach the end of the file. Instead we schedule a later read to see if data was appended to the file since the last read.

We first acquire a the `AsyncCallback` pointing to a local function that will be what actually handles the read bytes (we use the [scala.util.Try](http://www.scala-lang.org/api/2.11.8/index.html#scala.util.Try) data structure here which will either be a `Success(bytes)` or a `Failure(exception)` allowing us to share a single callback for both failed and successful reads):

```Java
chunkCallback = createAsyncCallback((tryInteger) -> {
 if (tryInteger.isSuccess()) {
   int readBytes = tryInteger.get();
   if (readBytes > 0) {
     buffer.flip();
     push(out, ByteString.fromByteBuffer(buffer));
     position += readBytes;
     buffer.clear();
   } else {
     // hit end, try again in a while
     scheduleOnce("poll", pollingInterval);
   }

 } else {
   failStage(tryInteger.failed().get());
 }
});
```
[complete source](https://github.com/akka/akka-stream-contrib/blob/master/contrib/src/main/java/akka/stream/contrib/FileTailSource.java#L90)

We then use that callback in the `CompletionHandler` which is how the `java.nio` API will call us back. Note that there is an “attachment” passed as a parameter from the read to the callback and the actual consumer is stateless meaning that in this specific case we can keep a consumer singleton and share it between all instances of the `GraphStageLogic` without problems.

We pass the callback and the completion handler to `read`:
```Java
private void doPull() {
  channel.read(buffer, position, chunkCallback, completionHandler);
}
```
[complete sources](https://github.com/akka/akka-stream-contrib/blob/master/contrib/src/main/java/akka/stream/contrib/FileTailSource.java#L116)

Which will invoke either of the two methods on the `CompletionHandler` when the read operation completes:
```Java
new CompletionHandler<Integer, AsyncCallback<Try<Integer>>>() {
  @Override
  public void completed(Integer result, AsyncCallback<Try<Integer>> attachment) {
    attachment.invoke(new Success<>(result));
  }

  @Override
  public void failed(Throwable exc, AsyncCallback<Try<Integer>> attachment) {
    attachment.invoke(new Failure<>(exc));
  }
};
```
[complete sources](https://github.com/akka/akka-stream-contrib/blob/master/contrib/src/main/java/akka/stream/contrib/FileTailSource.java#L41)

We have full control over when we trigger a read here. This will play nicely with back pressure and the stage will simply not read data when downstream is back pressuring.

## AMQPSource
A more complex example of an asynchronous callback is the AMQP connector source, also in [Akka Stream Contrib ](https://github.com/akka/akka-stream-contrib), which uses the [RabbitMQ driver](https://www.rabbitmq.com/java-client.html) to connect to an AMQP capable message broker.

The graph stage registers a listener which will be invoked when a message is available, and we use an `AsyncCallback` to make sure execution will be on the right thread:

```Scala
val consumerCallback = getAsyncCallback(handleDelivery)
val shutdownCallback = getAsyncCallback[Option[ShutdownSignalException]] {
  case Some(ex) => failStage(ex)
  case None     => completeStage()
}


val amqpSourceConsumer = new DefaultConsumer(channel) {
  override def handleDelivery(consumerTag: String, envelope: Envelope, properties: BasicProperties, body: Array[Byte]): Unit = {
   consumerCallback.invoke(IncomingMessage(ByteString(body), envelope, properties))
  }

  override def handleCancel(consumerTag: String): Unit = {
   // non consumer initiated cancel, for example happens when the queue has been deleted.
   shutdownCallback.invoke(None)
  }

  override def handleShutdownSignal(consumerTag: String, sig: ShutdownSignalException): Unit = {
   // "Called when either the channel or the underlying connection has been shut down."
   shutdownCallback.invoke(Option(sig))
  }
}

channel.basicConsume(
 settings.queue,
 false, // never auto-ack
 settings.consumerTag, // consumer tag
 settings.noLocal,
 settings.exclusive,
 settings.arguments.asJava,
 amqpSourceConsumer
)
```
[complete sources](https://github.com/akka/akka-stream-contrib/blob/master/amqp/src/main/scala/akka/stream/contrib/amqp/AmqpSource.scala#L66)

This alone does not help us with back pressure though, luckily the RabbitMQ client also lets us define a prefetch size together with an ACK protocol, so that we can limit the amount of outstanding unacknowledged messages.

As an optimization we keep an internal buffer that can fit exactly this number of elements so that incoming messages can be batched rather than sent one by one from the message broker. When downstream is ready to process a message we take it out of the buffer and emit it downstream, we then send an ACK back to the broker so that we can receive new incoming messages.

```Scala
def handleDelivery(message: IncomingMessage): Unit = {
 if (isAvailable(out)) {
   pushAndAckMessage(message)
 } else {
   if (queue.size + 1 > bufferSize) {
     failStage(new RuntimeException(s"Reached maximum buffer size $bufferSize"))
   } else {
     queue.enqueue(message)
   }
 }
}
```
[complete sources](https://github.com/akka/akka-stream-contrib/blob/master/amqp/src/main/scala/akka/stream/contrib/amqp/AmqpSource.scala#L112)

It is therefore very important to isolate such stages on a separate dispatcher, preferably thread pool based ones. The number of threads will limit how many concurrent instances of the GraphStageLogic can run on the system but will not affect other parts.

Selecting a separate dispatcher in Akka Streams is done by returning it from the `initialAttributes` of the `GraphStage`. (Note that this will isolate the `GraphStageLogic` into a separate actor when materializing and therefore introduce an input buffer to optimize passing the asynchronous boundary, read more
in the docs: [Scala](http://doc.akka.io/docs/akka/2.4/scala/stream/stream-rate.html#Buffers_for_asynchronous_stages) and [Java](http://doc.akka.io/docs/akka/2.4/java/stream/stream-rate.html#Buffers_for_asynchronous_stages))

```Scala
val defaultAttributes = Attributes.name("AmsqpSink")
  .and(ActorAttributes.dispatcher("akka.stream.default-blocking-io-dispatcher"))
```

## Polling based APIs
Some libraries have APIs where data is acquired by calling a polling method, the legacy Java `InputStream` APIs are examples of this. There are a few variations of poll based APIs though, the mentioned Java ones being the first, where the poll will block the calling thread indefinitely (there are workarounds but in general this is how it often is used).

This one is hard to adapt, but most important is to isolate it from the rest of the system as mentioned in the Blocking Push section above.

### Timed and Non-blocking polling
A more resource friendly variation of blocking polling is where you can provide a timeout to the blocking poll making fail or return if there was no data. A special case of this is non blocking polling, where the call always returns right away even if there is no elements. Both these two can be integrated in the same way, when there is demand, we poll (with a very short timeout in the timed case) and if we get no data back we schedule a slight back off, and then check again.

This can be implemented using the `TimedGraphStageLogic` which provides a facility for scheduling calls to a method which can then do the polling. In this sample we do exactly this to poll the WatchService for filesystem changes:

```Java
private void schedulePoll() {
  scheduleOnce("poll", pollInterval);
}

@Override
public void onTimer(Object timerKey) {
  if (!isClosed(out)) {
    doPoll();
    if (!buffer.isEmpty()) {
      pushHead();
    } else {
      schedulePoll();
    }
  }
}
```
[original sources](https://github.com/akka/akka-stream-contrib/blob/master/contrib/src/main/java/akka/stream/contrib/DirectoryChanges.java#L105)
