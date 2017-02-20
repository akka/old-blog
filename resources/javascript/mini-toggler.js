// mini toggler
(function() {

  // get all the mini-togglers
  var togglers = document.querySelectorAll(".mini-toggler");
  
  // loop through the togglers and bind a click event
  for (var i = 0; i < togglers.length; i++) {
    togglers[i].addEventListener("click", function(e) {
      e.preventDefault();

      // set the vars to work with
      var toggle_content = document.getElementById(this.hash.replace("#", "")),
          group = this.getAttribute("data-toggler-group"),
          add_class = function(el, classname) {
            el.className += " "+classname;
          },
          remove_class = function(el, classname) {
            el.className = el.className.replace(classname, "").trim();
          };

      // if we have a data-toggler-group-attribute - toggle between them
      if (group) {
        var group_togglers = document.querySelectorAll("[data-toggler-group="+group+"]");
        for (var i = 0; i < group_togglers.length; i++) {
          // leave the current element you clicked alone
          if (group_togglers[i] == this) { continue; }

          // remove toggler active class
          remove_class(group_togglers[i], "toggler-active");
          // remove toggler content active class 
          remove_class(document.getElementById(group_togglers[i].hash.replace("#", "")), "active");
        }
      }

      // add/remove class name from both toggler and toggle content
      if (toggle_content.className.indexOf("active") == -1) {
        add_class(this, "toggler-active");
        add_class(toggle_content, "active");
      } else {
        remove_class(toggle_content, "active");
        remove_class(this, "toggler-active");
      }
    });
  }

})();