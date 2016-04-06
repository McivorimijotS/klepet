function divElementEnostavniTekst(sporocilo) {
  var poprSporocilo = preveriSmeska(sporocilo);
  poprSporocilo = preveriSliko(poprSporocilo);
  poprSporocilo = preveriVideo(poprSporocilo);
  
  if (sporocilo != poprSporocilo) {
    return $('<div style="font-weight: bold"></div>').html(poprSporocilo);
  } else {
    return $('<div style="font-weight: bold"></div>').text(sporocilo);
  }
}

function preveriSmeska(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
    
  if (jeSmesko) {
    return sporocilo.replace(/\</g,'&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;','png\' />');
  }
  return sporocilo;
}
      
function preveriSliko(sporocilo) {
  return sporocilo.replace(/(https?:\/\/[^\s]*\.(?:jpg|png|gif))/gi, '<img src="$1" width="200" style="padding-left: 20px;"/>');
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function preveriVideo(sporocilo) {
  var youtubeHTML = '<iframe src="https://www.youtube.com/embed/$1" allowfullscreen width="200px" height="150px" style="margin-left: 20px;"></iframe>';
  var youtubeReg = /https:\/\/www\.youtube\.com\/watch\?v=([^\s]+)/gi;
  
  return sporocilo.replace(youtubeReg, youtubeHTML);
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  $('#vsebina').jrumble();

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    var $seznam = $('#seznam-uporabnikov');
    var $poslji = $('#poslji-sporocilo');
    $seznam.empty();
    
    function klik() {
      $poslji.val('/zasebno "' + $(this).html() + '" ').focus();
    }
    
    uporabniki = uporabniki.map(divElementEnostavniTekst);
    uporabniki.forEach(function(el) {
      el.on('click', klik);
      $seznam.append(el);
    });
    
  });
  
  socket.on('dregljaj', function() {
    console.log($('#vsebina').jrumble());
    $('#vsebina').trigger('startRumble');
    setTimeout(function() {
      $('#vsebina').trigger('stopRumble');
    }, 1500);
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
