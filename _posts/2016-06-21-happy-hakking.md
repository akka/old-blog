---
layout: post
title: "Happy hakking!"
description: ""
category: community 
tags: []
---

Hello world! This is a reboot of our blog.
!!PLACE-HOLDER!! 

Akka has a vibrant and passionate user community, the members of which have
created many independent projects using Akka as well as extensions to it.

The list on this page is contributed and maintained by the community, so
credit, blame, feature requests and so on should be directed at the respective
individuals or projects. Discussion about these projects is very welcome on the
[akka-dev mailing list](https://groups.google.com/forum/#!forum/akka-dev),
especially if the project in question does not have a forum of its own.

If you find something that is outdated or missing please submit a pull request by
[editing](https://github.com/akka/akka.github.com/edit/master/community/index.md)
this page, following the style shown in the example below.  We welcome all
entries, but we also reserve the right to remove entries for any reason (for
example due to the project being dead or in violation of applicable law, but
we also do not tolerate any kind of abusive behavior).  Being listed here does
not represent an endorsement by or affiliation with Typesafe, Inc. or the Akka
open-source project.

```scala
  /**
   * Controls whether this stage shall shut down when all its ports are closed, which
   * is the default. In order to have it keep going past that point this method needs
   * to be called with a `true` argument before all ports are closed, and afterwards
   * it will not be closed until this method is called with a `false` argument or the
   * stage is terminated via `completeStage()` or `failStage()`.
   */
  final protected def setKeepGoing(enabled: Boolean): Unit =
    interpreter.setKeepGoing(this, enabled)
```

{% highlight scala %}
  /**
   * Controls whether this stage shall shut down when all its ports are closed, which
   * is the default. In order to have it keep going past that point this method needs
   * to be called with a `true` argument before all ports are closed, and afterwards
   * it will not be closed until this method is called with a `false` argument or the
   * stage is terminated via `completeStage()` or `failStage()`.
   */
  final protected def setKeepGoing(enabled: Boolean): Unit =
    interpreter.setKeepGoing(this, enabled)
{% endhighlight %}
