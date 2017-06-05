$.ajax({
  type: 'POST',
  url: 'http://devision12.ru/api/user/auth.php',
  data: 'action=login',
  success: function(data){
    data = JSON.parse(data);
    if(data.status == 'login'){
      gotoSocket();
    }else {
      $('#Authorized').show();
    }
  }
});

$("#Authorized").on('click', ".button", function(){
          if($(this).data('action') == 'enter'){
            if($("#Authorized").find(".modal-body").find('#usr').val() && $("#Authorized").find(".modal-body").find('#pass').val()){
              $.ajax({
              type: 'POST',
              url: 'http://devision12.ru/api/user/auth.php',
              data: {'login': $("#Authorized").find(".modal-body").find('#usr').val(),
              'pass': $("#Authorized").find(".modal-body").find('#pass').val()},
              success: function(login){
                login = JSON.parse(login);
                if(login.status == "fail"){
                  $("#Authorized").find(".modal-body").find('.errorForm').show();
                  $("#Authorized").find(".modal-body").find('.error').text(login.message);
                  setTimeout(function(){
                    $("#Authorized").find(".modal-body").find('.error').empty();
                    $("#Authorized").find(".modal-body").find('.errorForm').hide();
                  }, 3000);
                }else if (login.status == "ok"){
                  gotoSocket();
                  $('#Authorized').hide();
                  window.localStorage.setItem("login", $("#Authorized").find(".modal-body").find('#usr').val());
                }
              }
            });
            }
          }else if ($(this).data('action') == 'reg'){
            $('#Register').show();
          }
        });

        function gotoSocket(){
          var socket = io.connect('http://moto-clubs.ru:8008');

          socket.on('connect', function () {
              //socket.emit("message", {message: text, name: name});
              socket.emit("addFeatures");
          });
          socket.on('addFeature', function (feature) {
              //socket.emit("message", {message: text, name: name});
              addFeature(feature.feature, feature.layer);
          });

          socket.on('getFeature', function (feature) {
              //socket.emit("message", {message: text, name: name});
              showModal(feature);
          });

          socket.on('removeFeature', function (data) {
              //socket.emit("message", {message: text, name: name});
              removeFeature(data.idFeature, data.layer);
          });

          socket.on('notification', function (data) {
              //socket.emit("message", {message: text, name: name});
              sendNotification(data.login, data.desk);
          });

          map.on('pointermove', function(evt) {
            map.getTargetElement().style.cursor =
                map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
          });
          map.on('singleclick', function(evt) {
            if(draw){
              removeInteraction();
              $('#createEvent').show();
              draw = undefined;
              var lonlat = ol.proj.toLonLat(evt.coordinate, 'EPSG:3857');
              $('#createEvent').find('.currLatLong').html("Широта: <div class='lat'>"+ lonlat[0] +"</div> Долгота: <div class='long'>"+ lonlat[1] +"</div>");
            }
            var a = 0;
            map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
              if(a == 0){
                  socket.emit("getFeature", feature.get("id"));
                }
                a++;
            })
          });

          $('#createEvent').on('click', '.button', function(){
            if($(this).data('action') == 'setPointInMap'){
              $('.modal').hide();
              $('.collaps_Menu').click();
              addInteraction();
            }else if($(this).data('action') == 'create'){
              var type =  $('#createEvent').find("#type").val();
              var desk = $('#createEvent').find("#desc").val();
              var lat = $('#createEvent').find(".lat").text();
              var long = $('#createEvent').find(".long").text();
              var userlogin = window.localStorage.getItem('login');
              if(type && desk && lat && long){
                $.ajax({
                  type: 'POST',
                  url: 'http://devision12.ru/api/event/create.php',
                  data: {'type':  type,
                  'desk': desk,
                  'lat': lat,
                  'long': long,
                  'userlogin': userlogin},
                  success: function(data){
                    data = JSON.parse(data);
                    if(data.status == 'ok'){
                      socket.emit("addFeature", {"lat": lat, "lon": long});
                      socket.emit("notification", {login: userlogin, desk: desk});
                      resetCreateEvent();
                      $('#createEvent').hide();
                    }
                  }
                });
              }
            }
          });