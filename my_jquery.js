$(document).ready(function() {
    
    var convertButton = $('.convert');
    var listButton = $('.list');
    var input1 = $('.input1');
    var input2 = $('.input2');
    var rates = 0;
    var timestamp = '';

    // Convert action
    convertButton.off().on('click', function(event) {
        event.preventDefault();
        $('.list_page').hide();
        $('.convert_page').show();
        $(this).siblings('a').removeClass('active');
        $(this).addClass('active');
    })

    // List action
    listButton.off().on('click', function(event) {
        event.preventDefault();
        populateListPage($(this));
    })

    // Select action
    $('select').off().on('change', function() {
        calculate($('.input1'));
    })

    // Swap action
    $('.swap').off().on('click', function(event) {
        event.preventDefault();
        swap();
    })

    // Input 1 action
    input1.off().off().on('keyup', function() {
        var field = $(this);
        calculate(field);
    })

    // Input 2 action
    input2.off().off().on('keyup', function() {
        var field = $(this);
        calculate(field);
    })

    // Search action
    $('.search').off().on('keyup', function() {
        search($(this));
    })


    // Populate Convert page
    $('.convert_page').show();

    $('.list1, .list2').empty();

    $.ajax({
        url: 'https://openexchangerates.org/api/currencies.json',
        method: 'GET'
    })
    .done(function(currencies) {

        for(currency in currencies) {
            let option = $('<option></option>');
            option.text(currencies[currency]);
            option.attr('value',currency);
            
            $('.list1, .list2').append(option);
        }

    })

    // Calculate
    function calculate(field) {

        // Remove previous result
        $('.string').remove()

        var val = field.val();
        
        // If the field is empty or isn't a number, empty the other one too
        if (val.length < 1 || isNaN(val)) { 
            
            $(field).siblings().filter('input').val('');
            let str = $('<p></p>').addClass('string');
            if (isNaN(val) == true) {
                str.text('Valid numbers only!')
            } else {
                str.text('Result here');
            }
            $('.calculate').append(str)
            return
        };

        // Currencies selection
        var select1 = $('.list1');
        var select2 = $('.list2');

        // Conversion direction
        var currentField = field.attr('class');
        if (currentField == 'input1') {

            var from = $('.list1').val(),
                to = $('.list2').val(),
                value = Number(val),
                fromRate = 0,
                toRate = 0;

        } else {

            var from = $('.list2').val(),
                to = $('.list1').val(),
                value = Number(val),
                fromRate = 0,
                toRate = 0;

        }
        
        // Use cached data if possible
        var lastTimestamp = Number($('.timestamp').attr('data-utc'));
        if (($('.timestamp').length < 1) || (lastTimestamp + 3600000 < Date.now())) {
            
            // Show the spinner
            $('.spinner.one').show();

            var appId = '367769e2d8204e40a9e3ddc894a88205';
            var myurl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
            
            $.ajax({
                url: myurl,
                method: 'GET',
                dataType: 'json'
            })
            .done(function (returnValue) {

                // timestamp 
                var d = new Date(0);
                d.setUTCMilliseconds(Number(returnValue.timestamp) * 1000);

                // Create new or update old
                if ($('.timestamp').length < 1) {
                    let timestamp = $('<span></span>')
                    timestamp.addClass('timestamp');
                    timestamp.attr('data-utc', Number(returnValue.timestamp) * 1000)
                    timestamp.text('Updated: ' + d.toLocaleTimeString());
                    $('.nav').append(timestamp);
                } else {
                    $('.timestamp').attr('data-utc', Number(returnValue.timestamp) * 1000);
                    $('.timestamp').text('Updated: ' + d.toLocaleTimeString())
                }
                
                // Update rates
                rates = returnValue.rates

                fromRate = Number(rates[from])
                toRate = Number(rates[to]);
                var endResult = value / fromRate * toRate;
                endResult = +endResult.toFixed(4)
                $(field).siblings().filter('input').val(endResult);
                var str =  $('<p></p>').addClass('string')
                str.text(value + ' ' + from + ' = ' + endResult + ' ' + to);
                
                $('.string').remove();
                $('.calculate').append(str);
                
                // Hide spinner
                $('.spinner.one').hide();
                
            })
            .fail (function(err) {

                $('.spinner.one').hide();
                console.log(err)

            })
        
        } else {

            fromRate = Number(rates[from])
            toRate = Number(rates[to]);
            endResult = value / fromRate * toRate;
            endResult = +endResult.toFixed(4)
            $(field).siblings().filter('input').val(endResult);
            var str =  $('<p></p>').addClass('string')
            str.text(value + ' ' + from + ' = ' + endResult + ' ' + to);
            
            $('.string').remove();
            $('.calculate').append(str);
            $('.spinner.one').hide();

        }

    }


    // Populate List page
    function populateListPage(button) {

        $('.convert_page').hide();
        $('.list_page').show();

        // Highlight the nav button
        button.siblings('a').removeClass('active');
        button.addClass('active');

        $('.search').focus();

        // Use cached data if possible
        var lastTimestamp = Number($('.timestamp').attr('data-utc'));

        if (($('.timestamp').length < 1) || (lastTimestamp + 3600000 < Date.now()) || ($('.currency_rates').length < 1)){

            // Remove old rates and start the spinner
            $('.rates').remove();
            $('.spinner.two').show();

            var appId = '367769e2d8204e40a9e3ddc894a88205'
            var myurl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`

            $.ajax({
                url: myurl,
                method: 'GET',
                dataType: 'json'
            })
            .done(function (returnValue) {

                // timestamp 
                var d = new Date(0);
                d.setUTCMilliseconds(Number(returnValue.timestamp) * 1000);

                // Create new or update old
                if ($('.timestamp').length < 1) {
                    let timestamp = $('<span></span>')
                    timestamp.addClass('timestamp');
                    timestamp.attr('data-utc', Number(returnValue.timestamp) * 1000)
                    timestamp.text('Updated: ' + d.toLocaleTimeString());
                    $('.nav').append(timestamp);
                } else {
                    $('.timestamp').attr('data-utc', Number(returnValue.timestamp) * 1000);
                    $('.timestamp').text('Updated: ' + d.toLocaleTimeString())
                }

                var div = $('<div></div>');
                div.addClass('rates');

                // Currencies and rates
                rates = returnValue.rates
                for (rate in rates) {
                    
                    let p = $('<p></p>');
                    p.addClass('currency_rates');
                    let currencyField = $('<div></span>').addClass('currency');
                    currencyField.text(rate)
                    let rateField = $('<div></div>').addClass('rate');
                    rateField.text(+rates[rate].toFixed(4))
                    p.append(currencyField).append(rateField)
                    div.append(p);
                }
                
                // Hide the spinner and add the rates
                $('.spinner.two').hide();
                $('.list_page').append(div);
                
            })
            .fail (function(err) {

                $('.spinner.two').hide()
                console.log(err)

            })

        }

    }

    // Swap
    function swap() {

        var list1 = $('.list1');
        var list2 = $('.list2');

        // Swap the lists
        $('.select').prepend(list2);
        list2.attr('class', 'list1');
        $('.select').append(list1);
        list1.attr('class', 'list2');

        // Re-calculate
        calculate($('.input1'))

    }

    function search(searchField) {

        var val = searchField.val().toUpperCase();
        var currencyRates = $('.currency_rates');

        $('.string2').remove()

        currencyRates.each(function(i, currencyRate) {
            let currency = $(currencyRate).children('.currency');
            if (currency.text().indexOf(val) > -1) {
                $(currencyRate).show()
            } else {
                $(currencyRate).hide()
            }
        })

        if($('.currency_rates[style="display: none;"]').length == currencyRates.length) {
            let str = $('<p></p>').addClass('string2').text('No match')
            $('.list_page').append(str);
        }

    }

})
    
