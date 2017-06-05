<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="main.css">
    <meta name="robots" content="noindex,nofollow"/>
    <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, minimal-ui" name="viewport">
    <link rel="stylesheet" href="https://openlayers.org/en/v4.1.1/css/ol.css" type="text/css">
    <link rel="stylesheet" href="main.css" type="text/css">
    <link rel="stylesheet" href="modal.css" type="text/css">
    <title>Мотоклаб</title>
    <meta name="yandex-verification" content="0e80fe988a440687" />
</head>
<body>
<div class="menu"><ul><li data-element="createEvent">Создать событие</li><li data-element="myEvent">Мои события</li><li data-element="club">Клуб</li><li data-element="exit">Выйти</li></ul></div><div class="collaps_Menu"></div>
<div id="map" class="map"></div>
<div class="modal" id="aboutWindow">
  <div class="modal-header"><div class="header-title"></div><span class="close">x</span></div>
  <div class="modal-body"></div>
  <div class="modal-footer"></div>
</div>
<div class="modal" id="oldBrowser">
  <div class="modal-header"><div class="header-title">Устаревший браузер</div></div>
  <div class="modal-body">Пожалуйста установите Google Chrome Браузер для дальнейшего использования сайта!</div>
  <div class="modal-footer"></div>
</div>
<?php
  require "client/module/auth/index.php";
  require "client/module/reg/index.php";
  require "client/module/createEvent/index.php";
  require "client/module/myEvent/index.php";
  require "client/module/club/index.php";
?>
<audio id="notificationSound">
<source src="/client/alert.wav"></source>
Update your browser to enjoy HTML5 audio!
</audio>
<script src="https://openlayers.org/en/v4.1.1/build/ol.js" type="text/javascript"></script>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="//moto-clubs.ru:8008/socket.io/socket.io.js"></script>
<script src="client/client.js"></script>
</body>
</html>