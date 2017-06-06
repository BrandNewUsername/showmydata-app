//Globals
var userId = 4; //localStorage.getItem("userId");

$(document).ready(function () {

    document.addEventListener("deviceready", function () {        
        forceLogin();
    });

    var myDate = new Date();
    myDate.setDate(myDate.getDate() - 1);

    $("#startdate").jqxDateTimeInput({width: '120px', height: '20px'});
    $("#startdate").jqxDateTimeInput('setDate', myDate);
    $("#enddate").jqxDateTimeInput({width: '120px', height: '20px'});

    $('#startdate').on('change', function (event) {
        showMyGraph('day');
        showMyGraph('hour');
    });
    $('#enddate').on('change', function (event) {
        showMyGraph('day');
        showMyGraph('hour');
    });
});

function forceLogin() {
    //console.log("forceLogin " + userId);

    location.href = "#Locaties"; //(userId !== undefined && userId !== '' && userId !== null) ? "#Locaties" : "#loginPage";
    if (userId !== undefined && userId !== '' && userId !== null)
    {
        setObjectsMenu();
        getMyPersonalData();
    }
}

function getUserId() {
    var username = "test"; //$('#username').val();
    var password = "test123"; //$('#password').val();

    if (username !== undefined && username !== '' && password !== undefined && password !== '')
    {
        $.post('http://data.showmydata.nl/logindata', {name: username, password: password})
                .done(function (data) {
                    data = JSON.parse(data);
                    var receivedUserId = data[0] !== undefined ? data[0].id : undefined;
                    console.log(receivedUserId);
                    if ($.isNumeric(receivedUserId) === true)
                    {
                        userId = receivedUserId;
                        localStorage.setItem("userId", receivedUserId);
                        forceLogin();
                    } else {

                    }
                })
                .fail(function(){
                    console.log("Error when connecting host");
                });
    } else {
        //console.log('invalid stuff');
    }
}

function removeUserSettings() {
    userId = null;
    localStorage.setItem("userId", "");
    forceLogin();
}

function getMyPersonalData() {

    var dataUrl = 'http://data.showmydata.nl/customerdata/' + userId;
    var result_html = '';

    $.ajax({
        url: dataUrl,
        dataType: 'json',
        success: function (response) {
            //console.log("getMyPersonalData " + response);
            $.each(response, function (key, val) {
                result_html += '<tr>';
                result_html += '<td>' + val.name + '</td>';
                result_html += '<td>' + val.street + ' ' + val.housenr + '</td>';
                result_html += '<td>' + val.zip + '</td>';
                result_html += '<td>' + val.city_name + '</td>';
                result_html += '<td>' + val.phone + '</td>';
                result_html += '<td>' + val.email + '</td>';
                result_html += '<td><a href="#" onclick="window.open(\'' + val.web + '\', \'_system\');" title="Visit your website" >' + val.web + '</a></td>';
                result_html += '</tr>';
            });
            $('#customer-data').empty().append(result_html);
            $('#customer-data').table('refresh');
        }
    });
}

function setObjectsMenu() {
    var dataUrl = 'http://data.showmydata.nl/objectsdata/' + userId;
    var result_html = '';
    var i = 0;
    var selected = 'selected="selected"';
    var notSelected = '';

    $.ajax({
        url: dataUrl,
        dataType: 'json',
        success: function (response) {
            //console.log("getMyObjectsData " + response);
            $.each(response, function (key, val) {
                result_html += '<option value="' + val.object_id + '" ' + (i == 0 ? selected : notSelected) + '>' + val.object_name + '</option>';
                i = i + 1;
            });
            $('#objectId').empty().append(result_html);
            $('#objectId').selectmenu('refresh'); //Render menu with new values

            showMyGraph('day'); //Once finished, render graph to prevent empty setting
            showMyGraph('hour'); //Once finished, render graph to prevent empty setting
            getMyObjectData();
        }
        //error: //console.log('getMyObjectsData failure')
    });
}

function getMyObjectData() {
    var objectId = $('#objectId').val();
    var dataUrl = 'http://data.showmydata.nl/objectdata/' + userId + '/' + objectId;
    var result_html = '';

    $.ajax({
        url: dataUrl,
        dataType: 'json',
        success: function (response) {
            //console.log("getMyObjectsData " + response);
            $.each(response, function (key, val) {
                var meetpunt = val.num_locations > 1 ? ' meetpunten' : ' meetpunt';
                var sensor = val.num_sensors > 1 ? ' sensoren' : ' sensor';
                result_html += '<tr>';
                result_html += '<td>' + val.object_name + '</td>';
                result_html += '<td>' + val.object_street + ' ' + val.object_housenr + '</td>';
                result_html += '<td>' + val.object_zip + '</td>';
                result_html += '<td>' + val.object_city_name + '</td>';
                result_html += '<td>' + val.object_description + '</td>';
                result_html += '<td>' + val.object_remarks + '</td>';
                result_html += '<td>' + val.num_locations + meetpunt + '</td>';
                result_html += '<td>' + val.num_sensors + sensor + '</td>';
                result_html += '</tr>';
            });
            $('#objects-body').empty().append(result_html);
            $('#objects-body').table("refresh");
        },
        //error: //console.log('getMyObjectsData failure')
    });
}

function showMyGraph(time) {
    $('#chartContainer-' + time + 's').empty().html('<div style="margin-right: auto; margin-left: auto; width: 100%; text-align: center; color: white" >Data wordt geladen...</div><div style="margin-right: auto; margin-left: auto; width: 100%; text-align: center; "><img src="css/images/ajax-loader.gif" ></div>');

    var time = (time !== '') ? time : 'day'; //Values: month / week / day / hour / minute

    // prepare chart data
    var startDate = $('#startdate').val();
    var endDate = $('#enddate').val();
    var objId = $('#objectId').val(); //@todo: Set this value
    var groupBy = time; //@todo: Set this value
    var maxValue = 0;

    startDate = startDate.replace(/\//g, '-');
    endDate = endDate.replace(/\//g, '-');

    //console.log('Show it to me baby: ' + startDate + ' --- ' + endDate);

    var dataUrl = 'http://data.showmydata.nl/graphdata/' + userId + '/' + objId + '/' + startDate + '/' + endDate + '/' + groupBy;

    var rawData = {};
    var sampleData = [];
    var serieLabels = {};
    $.ajax({
        url: dataUrl,
        dataType: 'json',
        success: function (response) {
            $.each(response, function (key, val) {
                switch (time) {
                    case 'minute':
                        rawData[val.minute_only] = {};
                        break;

                    case 'hour':
                        rawData[val.hour_only] = {};
                        break;

                    case 'day':
                    default:
                        rawData[val.date_only] = {};
                        break;
                }

                $.each(response, function (key_new, val_new) {
                    maxValue = val_new.max_value > maxValue ? val_new.max_value : maxValue;
                    switch (time) {
                        case 'minute':
                            if (val_new.minute_only === val.minute_only) {
                                //rawData[val.minute_only][val_new.object_name] = val_new.visitors_in;
                                rawData[val.minute_only]['name'] = val_new.object_name;
                                rawData[val.minute_only]['date'] = val_new.minute_only;
                                rawData[val.minute_only]['in'] = val_new.visitors_in;
                                rawData[val.minute_only]['avg'] = val_new.avg_visitors_in;
                            }
                            break;

                        case 'hour':
                            if (val_new.hour_only === val.hour_only) {
                                //rawData[val.hour_only][val_new.object_name] = val_new.visitors_in;
                                rawData[val.hour_only]['name'] = val_new.object_name;
                                rawData[val.hour_only]['date'] = val_new.hour_only;
                                rawData[val.hour_only]['in'] = val_new.visitors_in;
                                rawData[val.hour_only]['avg'] = val_new.avg_visitors_in;
                            }
                            break;

                        case 'day':
                        default:
                            if (val_new.date_only === val.date_only) {
                                rawData[val.date_only]['name'] = val_new.object_name;
                                rawData[val.date_only]['date'] = val_new.date_only;
                                rawData[val.date_only]['in'] = val_new.visitors_in;
                                rawData[val.date_only]['avg'] = val_new.avg_visitors_in;
                            }
                            break;

                    }
                });
                //Send data to objects div

            });

            console.log("Rawdata");
            console.log(rawData);
            $.each(rawData, function (index, value) {
                var obj = {}; //Object
                obj['Day'] = index;
                obj['max'] = maxValue;
                $.each(value, function (key, val) {
                    obj[key] = val;
                    //console.log(obj[key] + ' --- ' + val)
                    serieLabels[key] = key;
                });
                sampleData.push(obj);
            });

            //Create series for graph
            var serieArray = [];
            $.each(serieLabels, function (key, val) {
                var serieObj = {};
                serieObj['dataField'] = key;
                serieObj['displayText'] = key;
                serieArray.push(serieObj);
            });

            createGraph(sampleData, serieArray, time);
        }
    });

}

function createGraph(sampleData, serieArray, time) {

    var baseUnit = time;
    var dateFormat = (time === 'hour') ? 'HH:mm' : 'dd.MM';

    // prepare jqxChart settings
    var settings = {
        title: "Bezoekers in " + sampleData[0].name,
        description: "",
        showLegend: true,
        enableAnimations: true,
        padding: {left: 5, top: 5, right: 5, bottom: 5},
        titlePadding: {left: 40, top: 0, right: 0, bottom: 10},
        source: sampleData,
        xAxis: {
            dataField: 'date',
            gridLines: {visible: true},
            valuesOnTicks: false
        },
        colorScheme: 'scheme01',
        categoryAxis:
                {
                    dataField: 'Day',
                    type: 'date',
                    baseUnit: baseUnit,
                    dateFormat: dateFormat,
                    unitInterval: 1,
                    showGridLines: false,
                    labels:
                            {
                                angle: 90,
                                horizontalAlignment: 'right',
                                verticalAlignment: 'center',
                                rotationPoint: 'left',
                                offset: {y: -15}
                            }
                },
        seriesGroups:
                [
                    {
                        type: 'column',
                        columnsGapPercent: 60,
                        seriesGapPercent: 0,
                        valueAxis:
                                {
                                    minValue: 0,
                                    maxValue: sampleData[0].max,
                                    //unitInterval: 10,
                                    displayValueAxis: true
                                            //description: 'Aantal bezoekers'
                                },
                        series: [{dataField: 'in', displayText: 'Bezoekersaantal'}]
                    },
                    {
                        type: 'line',
                        valueAxis: {
                            minValue: 0,
                            maxValue: sampleData[0].max,
                            visible: false,
                            gridLines: {visible: false},
                            lables: {horizontalAlignment: 'left'}
                        },
                        series: [{dataField: 'avg', displayText: 'Gemiddelde bezoekersaantal van de winkels'}]

                    }
                ]
    };
    console.log("Max value: " + sampleData[0].max);
    // select the chartContainer DIV element and render the chart.
    $('#chartContainer-' + time + 's').empty().jqxChart(settings);
}

function showDay() {
    $('#hourContainer').hide();
    $('#dayContainer').show();
    $('#objectData').hide();
}

function showHour() {
    $('#hourContainer').show();
    $('#dayContainer').hide();
    $('#objectData').hide();
}

function showObjectData() {
    $('#hourContainer').hide();
    $('#dayContainer').hide();
    $('#objectData').show();
}