$(document).ready( function() {
  trace('Document ready loading data...', true);

  $body = $('body'); //Cache this for performance

  setBodyScale = function() {
    var scaleSource = $body.width(),
    scaleFactor = 0.1,
    maxScale = 600,
    minScale = 30; //Tweak these values to taste

    var fontSize = scaleSource * scaleFactor; //Multiply the width of the body by the scaling factor:

    if (fontSize > maxScale) fontSize = maxScale;
    if (fontSize < minScale) fontSize = minScale; //Enforce the minimum and maximums

    $('body').css('font-size', fontSize + '%');
  }

  activities=[];
  roles=[];
  countries=[];
  projects=[];
  orgs=[];

  currentLabel = 0;

  // get start conditions

  _startW = $(window).width();
  _startH = $(window).height();

  if ( _startW >= _startH ) {
    _startsize = Math.round(_startH * 0.9);
  } else {
    _startsize = Math.round(_startW * 0.9);
  }

  trace('Start size: ' + _startsize);

  $(window).resize(function() {
    setBodyScale();
    onResize();
  });
  onResize();

  queue()
    .defer(d3.json, "data/world-110m.json")
    .defer(d3.json, "data/data.json")
    .await(ready);
});


/**********************
*** RESIZE FUNCTION ***
**********************/

function onResize() {
  trace($(".connector").length);

  _availW = $(window).width();
  _availH = $(window).height();

  if ( _availW >= _availH ) {
    _mapsize = Math.round(_availH * 0.9);
  } else {
    _mapsize = Math.round(_availW * 0.9);
  }

  width = _mapsize;
  height = _mapsize;

  _top = (_availH - _mapsize)/2;

  _scale = 380 * _mapsize / 854;

  $("#body").width(_mapsize);
  $("#body").height(_mapsize);

  $("#body").css("marginTop", _top);

  mapInt = 0;
  if ( $(".map").length > 0 ) {
    clearTimeout(mapInt);
    mapInt = setTimeout(scaleMap, 400);
  }

  $(".connector").remove();
}

function scaleMap() {
  projection.scale(_scale).translate([_mapsize/2, _mapsize/2]);
  refresh(750);
  d3.select('.globe').transition().duration(600)
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', projection.scale());
}


/******************
*** DATA LOADED ***
******************/

function ready(error, world, data) {
  trace('Data loaded', true);

  trace(data);

  activities = data.acts;
  roles = data.roles;
  countries = data.countries;
  projects = data.projects;
  orgs = data.orgs;

  createMap(world);
}


/*****************
*** CREATE MAP ***
*****************/

function createMap(world) {

  $(".preloader").hide();

  $("body").append('<div class="counter">0</div>');
  $("body").append('<div class="projects-label">PROJECTS</div>');
  setBodyScale();

  trace('Dimensions: '+ _mapsize);

  projection = d3.geo.azimuthal()
    .scale(_scale)
    .origin([-11.03,42.37])
    .mode("orthographic")
    .translate([_mapsize/2, _mapsize/2]);

  circle = d3.geo.greatCircle()
  .origin(projection.origin());

  // TODO fix d3.geo.azimuthal to be consistent with scale
  scale = {
    orthographic: 380,
    stereographic: 380,
    gnomonic: 380,
    equidistant: 380 / Math.PI * 2,
    equalarea: 380 / Math.SQRT2
  };

  path = d3.geo.path().projection(projection);

  svg = d3.select("#body").append("svg:svg")
    .attr("width", _mapsize)
    .attr("height", _mapsize)
    .attr("class", "map")
    .on("mousedown", mousedown);


  var _grad = svg.append("svg:defs")
      .append("svg:radialGradient")
      .attr("id", "earth")
      .attr("cx", "47%")
      .attr("cy", "45%")
      .attr("r", "50%");

    _grad.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", 'white')
      .attr("stop-opacity", 1);

    _grad.append("svg:stop")
      .attr("offset", "85%")
      .attr("stop-color", 'white')
      .attr("stop-opacity", 1);

    _grad.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", '#eee')
      .attr("stop-opacity", 1);


  backgroundCircle = svg.append("circle")
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', projection.scale())
            .attr('fill', 'url(#earth)')
            .attr('class', 'globe');

  feature = svg.selectAll("path")
    .data(topojson.object(world, world.objects.countries).geometries)
    .enter().append("svg:path")
    .attr("d", clip)
    .attr("class", "country")
    .attr("cursor", function(d) {
      if (countries[d.id].projects.length > 0) { return 'pointer'; } else { return 'default'; }
    })
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
    .on('click', clicked);

  d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

  d3.select("select").on("change", function() {
    projection.mode(this.value).scale(scale[this.value]);
    refresh(750);
  });

  var m0,
  o0;

  function mousedown() {
    m0 = [d3.event.pageX, d3.event.pageY];
    o0 = projection.origin();
    d3.event.preventDefault();
    $(".connector").remove();
  }

  function mousemove() {
    if (m0) {
      var m1 = [d3.event.pageX, d3.event.pageY],
      o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
      projection.origin(o1);
      circle.origin(o1)
      refresh();
    }
  }

  function mouseup() {
    if (m0) {
      mousemove();
      m0 = null;
    }
  }

  _max = 0;
  _min = 100000;
  for (var i in countries) {
    if (countries[i].projects.length > _max) _max = countries[i].projects.length;
    if (countries[i].projects.length < _min) _min = countries[i].projects.length;
  }

  _color = d3.scale.linear().domain([_min, _max]).range(['#ddd','#081d58']);

  d3.selectAll(".country").transition()
    .style("fill", function(d,i){
      return _color(getData(d.id, 'projects'));
    })
    .style("fill-opacity", 1)
    .style("stroke-opacity", 0.5);

}

function refresh(duration) {
  (duration ? feature.transition().duration(duration) : feature).attr("d", clip);
}

function clip(d) {
  return path(circle.clip(d));
}





/**************************
*** COUNTRY INTERACTION ***
**************************/

function mouseover(d) {
  $("#label" + currentLabel).fadeOut('slow', function() { $(this).remove(); });
  currentLabel++;
  _angle = Math.random()*Math.PI*2;
  _x = -100 + Math.cos(_angle)*_mapsize/2.5;
  _y = -18 + Math.sin(_angle)*_mapsize/2.5;
  _div = $('<div class="zoupas-label" id="label' + currentLabel + '">' + countries[d.id].name + '</div>').css('marginTop', _y).css('marginLeft', _x);
  $('body').append(_div);
  if (countries[d.id].projects.length > 0) {
  clearTimeout(_countint);
  $('.counter').stop(true, true).fadeIn('fast');
  $('.projects-label').stop(true, true).fadeIn('fast');
    $('.counter').countTo({
      from: parseInt($('.counter').text()),
      to: countries[d.id].projects.length,
      speed: 500,
      refreshInterval: 50,
      formatter: function (value, options) {
                return Math.abs(value).toFixed(options.decimals);
            },
    });
  }
}

function mouseout(d) {
  $("#label" + currentLabel).fadeOut('slow', function() { $(this).remove(); });
  _countint = setTimeout(function() {
    $('.counter').stop(true, true).fadeOut('fast');
    $('.counter').countTo({
      from: parseInt($('.counter').text()),
      to: 0,
      speed: 200,
      refreshInterval: 50,
      formatter: function (value, options) {
                return Math.abs(value).toFixed(options.decimals);
            },
    });
    $('.projects-label').stop(true, true).fadeOut('fast');
  }, 300);
}

function getCountryInfo(id) {
  return '<span>' + countries[id].name + '</span><br/>Ogranizations: ' + countries[id].orgs.length + '<br/>Projects: ' + countries[id].projects.length;
}

function clicked(d) {
  trace('Clicked ' + countries[d.id].name);
  lineToGreece(d.id);
}

function lineToGreece(id) {

  _arr = [];

  for (var a in countries[id].projects) {
    for (var b in countries) {
      if (b != id) {
        for (var k in countries[b].projects) {
          if ( countries[b].projects[k] == countries[id].projects[a] ) {
            var _found = false;
            for (var s in _arr) {
              if (_arr[s].country == b) {
                _arr[s].value = _arr[s].value + 1;
                _found = true;
                break;
              }
            }
            if (!_found) {
              _o = {};
              _o.country = b;
              _o.value = 1;
              _arr.push(_o)
            }
          }
        }
      }
    }
  }

  lineData = [];

  for (var a in _arr) {
    _arr[a].geometry = [countries[_arr[a].country].lat, countries[_arr[a].country].lon];
    lineData.push(
      { source: [countries[id].lat, countries[id].lon], target: [countries[_arr[a].country].lat, countries[_arr[a].country].lon], power: _arr[a].value }
    );
  }

  //trace(_arr);

  $(".connector").remove();

  var arc = d3.geo.greatArc();
  var arcs = svg.append("g").attr("id", "arcs");

  _connectorMax = 0;

  for (var a in _arr) {
    if ( _arr[a].value > _connectorMax ) _connectorMax = _arr[a].value;
  }

  _connectorScale = d3.scale.linear().domain([1, _connectorMax]).range([1, 5]);

  arcs.selectAll("path")
    .data(lineData)
    .enter().append("path")
    .attr("fill", "none")
    .attr("stroke", "#a13864")
    .attr("stroke-linecap", "round")
    .attr("stroke-opacity", 0.7)
    .attr("stroke-width", function(d){return _connectorScale(d.power);} )
    .attr("class", "connector")
    .attr("d", function(d) { return path(arc(d)); });

}

/*******************
*** INITIAL VIEW ***
*******************/

function gotoInitialView() {
  trace('Creating initial view', true);
  $(".zoupas").append('<div class="info round10"></div>');
  createControlButtons();
  zoomTo(settings.views[settings.initial.view]);
  createVisualizations();
  gotoVisualization(settings.visualizations[settings.initial.display]);
}

/*************************
*** GOTO VISUALIZATION ***
*************************/

function gotoVisualization(obj) {

  _max = 0;
  _min = 100000;
  for (var i in countries) {
    if (countries[i][obj.name].length > _max) _max = countries[i][obj.name].length;
    if (countries[i][obj.name].length < _min) _min = countries[i][obj.name].length;
  }

  _max = (Math.floor(_max / obj.factor) + 1) * obj.factor;

  _color = d3.scale.linear().domain([_min, _max]).range([obj.min, obj.max]);

  d3.selectAll(".country").transition()
    .style("fill", function(d,i){
      return _color(getData(d.id, obj.name));
    })
    .style("fill-opacity", 1)
    .style("stroke-opacity", 0.5);

  // Arrange legend

  $(".map-scale").animate(
    {bottom: '-70px'}, 'fast', function() {
      $(".scale-min").text(_min);
      $(".scale-max").text(_max);
      $(".vis-title").text(obj.title);
      $(".scale-indicator").width(100);
      d3.select(".indicator").transition().attr("width", 100);
      d3.select(".indicator").transition().style("fill", "url(#grad-" + obj.name + ")").each("end", arrangeIndicator);
    }
  );

  currentVis = obj.name;

  $(".button-vis").each(function() {
    if ($(this).attr('target') == obj.name ) {
      $(this).hide();
    } else {
      $(this).show();
    }
  });
}

function arrangeIndicator() {
  var _avail = $(".vis-title").width() - $(".scale-min").width() - $(".scale-max").width() - 10;
  $(".scale-indicator").width(_avail);
  d3.select(".indicator").transition().attr("width", _avail);
  $(".map-scale").animate({bottom: '10px'}, 'fast');
}

/********************************
*** GET COUNTRY ORGS/PROJECTS ***
*********************************/

function getData(id, type) {
  if (typeof(countries[id]) != "undefined") {
    return countries[id][type].length;
  } else {
    trace('Missing: ' + id);
  }
}

/****************************
*** CREATE VISUALIZATIONS ***
****************************/

function createVisualizations() {

  scaleIndicator = d3.select(".scale-indicator").append("svg:svg");
  scaleIndicator.append("svg:rect")
    .attr("width", 100)
    .attr("height", 15)
    .attr("class", "indicator");

  _container = $('<div class="vis-container"></div>');

  for (var key in settings.visualizations) {
    var _grad = scaleIndicator.append("svg:defs")
      .append("svg:linearGradient")
      .attr("id", "grad-" + settings.visualizations[key].name)
      .attr("x1", "0%")
      .attr("y1", "50%")
      .attr("x2", "100%")
      .attr("y2", "50%")
      .attr("spreadMethod", "pad");

    _grad.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", settings.visualizations[key].min)
      .attr("stop-opacity", 1);

    _grad.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", settings.visualizations[key].max)
      .attr("stop-opacity", 1);

    _button = $('<div class="button-vis" target="' + settings.visualizations[key].name + '" id="vis-' + settings.visualizations[key].name + '">SHOW ' + settings.visualizations[key].title.toUpperCase() + '</div>');
    _container.append(_button);

  }

  $(".zoupas").append(_container);

  $(".button-vis").each(function() {
    $(this).click(function() {
      gotoVisualization(settings.visualizations[$(this).attr('target')]);
    });
  });
}

/***************************
*** ZOOM CONTROL BUTTONS ***
***************************/

function createControlButtons() {
  _container = $('<div class="zoom-container"></div>');
  for (var key in settings.views) {
    if (settings.views[key].name != 'zoomed') {
      _button = $('<div class="button" target="' + settings.views[key].name + '" id="zoom-' + settings.views[key].name + '">' + settings.views[key].name.toUpperCase() + '</div>');
      _container.append(_button);
    }
  }
  $(".zoupas").append(_container);

  $(".button").each(function() {
    $(this).click(function() {
      zoomTo(settings.views[$(this).attr('target')]);
    });
  });

}

/********************
*** ZOOM FUNCTION ***
********************/

function zoomTo(obj) {
  if (zoomedId != 0) {
    $("#cap" + zoomedId).hide();
  }

  if ( currentView != obj.name ) {
    _translation = 'translate(' + obj.offset.x + ',' + obj.offset.y + ')scale(' + obj.scale + ')';
    $("#zoom-" + currentView).removeClass('active');
    g.transition().
      duration(750)
      .attr("transform", _translation);
    g.selectAll(".active").classed("active", false);
    currentView = obj.name;
    $("#zoom-" + obj.name).addClass('active');
    $(".country-info").fadeOut('fast');
  }
}


/*************
*** TRACER ***
*************/


function trace(o, debug) {
  if (debug) {
    $(".debug").append('<br/>' + o);
    console.log(o);
  } else {
    console.log(o);
  }
}
