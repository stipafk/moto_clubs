$(document).ready(function () {
    var that = this;
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/client/empty.js').then(function (registration) {
            Notification.requestPermission(function (result) {
                if (result === 'granted') {
                    that.registration = registration;
                }
            });
        });

        function sendNotification(user, desk) {
            try {
                // var notify = new Notification(user, {body: desk});
                mobileNotif(user, desk);
                var audio = $('#notificationSound');
                audio[0].play();
            } catch (err) {
                console.log('Браузер не поддерживает уведомления');
            }
        }

        function mobileNotif(user, desk) {
            that.registration.showNotification(user, {
                body: desk,
                vibrate: [200, 100, 200, 100, 200, 100, 200],
                icon: '/client/icon.png'
            });
        }

        $.ajaxSetup({
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            }
        });

        $.ajax({
            type: 'POST',
            url: '//devision12.ru/api/user/auth.php',
            data: 'action=login',
            success: function (data) {
                data = JSON.parse(data);
                if (data.status == 'login') {
                    gotoSocket();
                } else {
                    $('#Authorized').show();
                }
            }
        });
        if(window.localStorage.getItem('login')) {
            that.userlogin = window.localStorage.getItem('login');
        }

        function gotoSocket() {
            var socket = io.connect('//moto-clubs.ru:8008');

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

            socket.on('getFeatures', function (data) {
                $('#myEvent').show();
                var $body = $('#myEvent').find('.modal-body');
                $body.empty();
                var features = JSON.parse(data);
                var box = $('<div class="form">');
                $.each(features, function (i, item) {
                    var line = $('<div>');
                    var href = $('<a data-id=' + item.id + ' data-layer=' + item.layer + '>' + item.name + ' - ' + item.description + '</a>').css({'cursor': 'pointer'});
                    var removeBtn = $('<span>x</span>').css({'float': 'right', 'cursor': 'pointer'});
                    removeBtn.on('click', function () {
                        var remove = $(this).parent();
                        var current = $(this).parent().find('a');
                        $.ajax({
                            type: 'POST',
                            url: '//devision12.ru/api/event/delete.php',
                            data: {'id': current.data('id')},
                            success: function () {
                                socket.emit("removeFeature", {
                                    idFeature: current.data('id'),
                                    layer: current.data('layer')
                                });
                                remove.remove();
                            }
                        });
                    });
                    line.append(href).append(removeBtn);
                    href.on('click', function () {
                        socket.emit('getFeature', $(this).data('id'));
                    });
                    box.append(line);
                })
                $body.append(box);
            });

            socket.on('removeFeature', function (data) {
                //socket.emit("message", {message: text, name: name});
                removeFeature(data.idFeature, data.layer);
            });

            socket.on('notification', function (data) {
                //socket.emit("message", {message: text, name: name});
                sendNotification(data.login, data.desk);
            });

            socket.on('RemoveFeatureNotif', function (data) {
                if (data.userlogin == that.userlogin) {
                    sendNotification("Удаленно: " + data.layer, "Из за окончания времени");
                }
            });

            $('.menu').on('click', 'li', function () {
                if ($(this).data("element") != "exit") {
                    $('#' + $(this).data('element')).show();
                    if ($(this).data("element") == 'myEvent') {
                        socket.emit("getFeatures", that.userlogin);
                    } else if ($(this).data("element") == 'club') {
                        var $this = $(this);
                        $.ajax({
                            type: 'POST',
                            url: '//devision12.ru/api/user/getClub.php',
                            data: {"login": window.localStorage.getItem('login')},
                            success: function (data) {
                                var newData = JSON.parse(data);
                                if (newData && newData.id) {
                                    var container = $('<div class="club-cont"></div>');
                                    var clubImage = $('<div class="club-image"><img src="'+ newData.clubImage +'" width="64" height="64"></div>');
                                    var clubName = $('<div class="club-name" data-id="'+ newData.clubid +'">' + newData.clubName + '</div>');
                                    container.append(clubImage);
                                    container.append(clubName);
                                    $('#' + $this.data('element')).find('.modal-body').find('.form').html(container);
                                    $('#' + $this.data('element')).find('.modal-footer').html('<div class="button" data-action="leaveClub">Покинуть Клуб</div>');
                                    console.log(newData);
                                } else {
                                    $('#' + $this.data('element')).hide();
                                }
                            }
                        });
                    }
                } else {
                    $.ajax({
                        type: 'POST',
                        url: '//devision12.ru/api/user/auth.php',
                        data: {"action": "logout"},
                        success: function (login) {
                            window.location.reload();
                        }
                    });
                }
            });

            map.on('pointermove', function (evt) {
                map.getTargetElement().style.cursor =
                    map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : '';
            });

            map.on('singleclick', function (evt) {
                if (draw) {
                    removeInteraction();
                    $('#createEvent').show();
                    draw = undefined;
                    var lonlat = ol.proj.toLonLat(evt.coordinate, 'EPSG:3857');
                    $('#createEvent').find('.currLatLong').html("Широта: <div class='lat'>" + lonlat[0] + "</div> Долгота: <div class='long'>" + lonlat[1] + "</div>");
                }
                var a = 0;
                map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                    if (a == 0) {
                        socket.emit("getFeature", feature.get("id"));
                    }
                    a++;
                })
            });

            $('#createEvent').on('click', '.button', function () {
                if ($(this).data('action') == 'setPointInMap') {
                    $('.modal').hide();
                    $('.collaps_Menu').click();
                    addInteraction();
                } else if ($(this).data('action') == 'create') {
                    var type = $('#createEvent').find("#type").val();
                    var desk = $('#createEvent').find("#desc").val();
                    var lat = $('#createEvent').find(".lat").text();
                    var long = $('#createEvent').find(".long").text();
                    var userlogin = window.localStorage.getItem('login');
                    if (type && desk && lat && long) {
                        $.ajax({
                            type: 'POST',
                            url: '//devision12.ru/api/event/create.php',
                            data: {
                                'type': type,
                                'desk': desk,
                                'lat': lat,
                                'long': long,
                                'userlogin': userlogin
                            },
                            success: function (data) {
                                data = JSON.parse(data);
                                if (data.status == 'ok') {
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

            function showModal(feature) {
                feature = JSON.parse(feature);
                $modal = $('#aboutWindow');
                $modal.show();
                $modal.find(".modal-header").find(".header-title").text(feature.name);
                $modal.find(".modal-header").find(".header-title").attr('data-id', feature.id)
                var desc = $('<div class="desc">').html(feature.description);
                $modal.find(".modal-body").html(desc);
                if (feature.userlogin == window.localStorage.getItem('login')) {
                    var del = $('<div class="button">Удалить</div>');
                    del.on('click', function () {
                        $.ajax({
                            type: 'POST',
                            url: '//devision12.ru/api/event/delete.php',
                            data: {'id': $modal.find(".modal-header").find(".header-title").attr('data-id')},
                            success: function () {
                                var idFeature = $modal.find(".modal-header").find(".header-title").attr('data-id');
                                var layer = $modal.find(".modal-header").find(".header-title").text();
                                //removeFeature(idFeature, layer);
                                socket.emit("removeFeature", {idFeature: idFeature, layer: layer});
                                $modal.find(".modal-header").find('.close').click();
                            }
                        });
                    });
                    $modal.find(".modal-footer").html(del);
                }
            }
        }

        function resetCreateEvent() {
            $('#createEvent').find("#type").val('')
            $('#createEvent').find("#desc").val('');
            $('#createEvent').find(".currLatLong").empty();
        }

        $("#Authorized").on('click', ".button", function () {
            if ($(this).data('action') == 'enter') {
                if ($("#Authorized").find(".modal-body").find('#usr').val() && $("#Authorized").find(".modal-body").find('#pass').val()) {
                    $.ajax({
                        type: 'POST',
                        url: '//devision12.ru/api/user/auth.php',
                        data: {
                            'login': $("#Authorized").find(".modal-body").find('#usr').val(),
                            'pass': $("#Authorized").find(".modal-body").find('#pass').val()
                        },
                        success: function (login) {
                            login = JSON.parse(login);
                            if (login.status == "fail") {
                                $("#Authorized").find(".modal-body").find('.errorForm').show();
                                $("#Authorized").find(".modal-body").find('.error').text(login.message);
                                setTimeout(function () {
                                    $("#Authorized").find(".modal-body").find('.error').empty();
                                    $("#Authorized").find(".modal-body").find('.errorForm').hide();
                                }, 3000);
                            } else if (login.status == "ok") {
                                gotoSocket();
                                $('#Authorized').hide();
                                window.localStorage.setItem("login", $("#Authorized").find(".modal-body").find('#usr').val());
                            }
                        }
                    });
                }
            } else if ($(this).data('action') == 'reg') {
                $('#Register').show();
            }
        });

        $("#Register").on('click', ".button", function () {
            if ($(this).data('action') == 'reg') {
                $.ajax({
                    type: 'POST',
                    url: '//devision12.ru/api/user/create.php',
                    data: {
                        'login': $("#Register").find(".modal-body").find('#usr').val(),
                        'pass': $("#Register").find(".modal-body").find('#pass').val(),
                        'email': $("#Register").find(".modal-body").find('#email').val()
                    },
                    success: function (login) {
                        login = JSON.parse(login);
                        if (login.status == 'ok') {
                            $("#Register").hide();
                        } else {
                            $("#Register").find('.error').text(login.message);
                            $("#Register").find('.errorForm').show();
                            setTimeout(function () {
                                $("#Register").find(".modal-body").find('.error').empty();
                                $("#Register").find(".modal-body").find('.errorForm').hide();
                            }, 3000);
                        }
                    }
                });
            }
        });

        var draw; // global so we can remove it later
        function addInteraction() {
            draw = new ol.interaction.Draw({
                features: features,
                type: /** @type {ol.geom.GeometryType} */ "Point"
            });
            map.addInteraction(draw);
        }

        function removeInteraction() {
            map.removeInteraction(draw);
            featureOverlay.getSource().forEachFeature(function (feature, layer) {
                featureOverlay.getSource().removeFeature(feature);
            });
        }

        $('.collaps_Menu').on('click', function () {
            if ($(this).hasClass('active')) {
                $('.menu').animate({left: '-280px'});
                $(this).animate({left: '0'});
                $(this).removeClass('active');
            } else {
                $('.menu').animate({left: 0});
                $(this).animate({left: '280px'});
                $(this).addClass('active');
            }
        });

        function removeFeature(idFeature, layer) {
            var feature;
            if (layer == 'ДТП') {
                feature = that.dtpSource.getFeatureById(idFeature);
                that.dtpSource.removeFeature(feature);
            }
            if (layer == 'Помощь') {
                feature = that.helpSource.getFeatureById(idFeature);
                that.helpSource.removeFeature(feature);
            }
            // if($('#aboutWidnow').css('display') != 'none' && $modal.find(".modal-header").find(".header-title").attr('data-id') == idFeature){
            // 	$modal.find(".modal-header").find(".close").click()
            // }
        }

        function addFeature(feature, layer) {
            // var newFeatures = new ol.format.GeoJSON().readFeature( feature );
            // var geojsonObject = {
            //   'type': 'FeatureCollection',
            //   'crs': {
            //     'type': 'name',
            //     'properties': {
            //       'name': 'EPSG:3857'
            //     }
            //   },
            //   'features': []
            // };

            feature = JSON.parse(feature);
            console.log(feature.geometry.coordinates);
            feature.geometry.coordinates = ol.proj.fromLonLat(feature.geometry.coordinates)
            //geojsonObject.features.push(feature);

            // var current = new ol.Feature({
            //   geometry: new ol.geom.Point(ol.proj.fromLonLat(feature.geometry.coordinates))
            // });
            var features = (new ol.format.GeoJSON()).readFeature(feature);
            features.setId(feature.properties.id);
            if (layer == 'ДТП') {
                that.dtpSource.addFeature(features);
            } else if (layer == 'Клубы') {

            } else if (layer == 'Сбор') {

            } else if (layer == 'Помощь') {
                that.helpSource.addFeature(features);
            }
        }


        var helpImage = new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 0.96],
            opacity: 1,
            src: 'server/static/help.png'
            //src: 'https://openlayers.org/en/v4.1.1/examples/data/icon.png'
        }))

        var helpStyles = {
            'Point': new ol.style.Style({
                image: helpImage
            })
        }
        var HelpstyleFunction = function (feature) {
            return helpStyles[feature.getGeometry().getType()];
        };


        var dtpImage = new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 0.96],
            opacity: 1,
            src: 'server/static/avaria.png'
            //src: 'https://openlayers.org/en/v4.1.1/examples/data/icon.png'
        }))

        var dtpStyles = {
            'Point': new ol.style.Style({
                image: dtpImage
            })
        }
        var DTPstyleFunction = function (feature) {
            return dtpStyles[feature.getGeometry().getType()];
        };

        //СЛОЙ ПОМОЩИ
        that.helpSource = new ol.source.Vector();
        that.helpLayer = new ol.layer.Vector({
            source: that.helpSource,
            style: HelpstyleFunction
        });

        //ДТП СЛОЙ
        that.dtpSource = new ol.source.Vector();
        that.dtpLayer = new ol.layer.Vector({
            source: that.dtpSource,
            style: DTPstyleFunction
        });

        // function showPosition(position) {
        //     var coord = [position.coords.longitude , position.coords.latitude];
        //     coord = ol.proj.fromLonLat(coord);
        //     var feature = new ol.Feature({
        //         geometry: new ol.geom.Point(coord),
        //         name: 'My Polygon'
        //     });
        //     that.myPointSource.addFeature(feature);
        //     console.log(position, feature);
        // }
        var accuracyFeature = new ol.Feature();

        var positionFeature = new ol.Feature();
        positionFeature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({
                    color: '#3399CC'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 2
                })
            })
        }));

        var geoLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [accuracyFeature, positionFeature]
            })
        });

        that.helpLayer.setZIndex(1);
        that.dtpLayer.setZIndex(1);
        var map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                }), that.helpLayer, that.dtpLayer, geoLayer
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([36.282946, 54.503649]),
                zoom: 11
            })
        });

        if (navigator.geolocation) {
            var geolocation = new ol.Geolocation({
                projection: map.getView().getProjection()
            });
            geolocation.setTracking(true);
            geolocation.on('change:accuracyGeometry', function() {
                accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
            });
            geolocation.on('change:position', function() {
                var coordinates = geolocation.getPosition();
                positionFeature.setGeometry(coordinates ?
                    new ol.geom.Point(coordinates) : null);
            });
        }

        var features = new ol.Collection();
        var featureOverlay = new ol.layer.Vector({
            source: new ol.source.Vector({features: features}),
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });
        featureOverlay.setMap(map);

        $('.modal').on('click', '.close', function () {
            $(this).parents(".modal").hide();
        })
    }else {
        $('#oldBrowser').show();
    }
});