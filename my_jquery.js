$(document).ready(function() {
    
    var homeButton = $('.home');
    var convertButton = $('.convert');
    var listButton = $('.list');
    var navbar = $('.nav');
    var homePage = $('.homepage');
    var convertPage = $('.convert_page');
    var listPage = $('.list_page');

    var selectWindow = $('.select_window');
    var select1 = $('.select1');
    var select2 = $('.select2');
    var swapButton = $('.swap');
    var convertWindow = $('.convert_window');
    var input1 = $('.input1');
    var input2 = $('.input2');

    var searchField = $('.search');
    var toTopButton = $('#toTop');
    
    var rates = 0;
    var timestamp = '';

    // Home action
    homeButton.on('click', function(event) {

        event.preventDefault();
        populateHomepage();

    })

    // Convert action
    convertButton.on('click', function(event) {

        event.preventDefault();
        populateConvertPage();

    })

    // List action
    listButton.on('click', function(event) {

        event.preventDefault();
        populateListPage();

    })

    // Select action
    $('.select1, .select2').on('change', function() {

        calculate(input1);

    })

    // Swap action
    swapButton.on('click', function(event) {

        event.preventDefault();
        swap();

    })

    // Input 1 action
    input1.on('keyup', function() {
        
        var field = $(this);
        calculate(field);

    })

    // Input 2 action
    input2.on('keyup', function() {

        var field = $(this);
        calculate(field);

    })

    // Search action
    searchField.on('keyup', function() {
        
        search($(this));

    })

    // Scroll action
    $(window).on('scroll', function() {

        showToTopButton();

    })

    // To top button action
    toTopButton.on('click', function(event) {

        event.preventDefault();
        scrollToTop();

    })

    // Populate Homepage
    function populateHomepage() {

        convertPage.hide();
        listPage.hide()
        homePage.show();

        $('html').scrollTop(0);

        // Highlight the nav button
        var navButtons = $('.nav').children('a');
        navButtons.removeClass('active');
        var navHomeButton = navButtons.filter('.home');
        navHomeButton.addClass('active');

    }

    // Populate Convert page
    function populateConvertPage() {
        
        homePage.hide();
        listPage.hide();
        convertPage.show();

        $('html').scrollTop(0);

        // Highlight the nav button
        var navButtons = $('.nav').children('a');
        navButtons.removeClass('active');
        var navConvertButton = navButtons.filter('.convert');
        navConvertButton.addClass('active');

        var string = $('.stringSelect');
        string.remove();

        // If the selection lists are empty, try to get new currencies
        if (select1.children('option').length < 1) {
            
            // Show the spinner
            var spinner = $('.spinner.zero');
            spinner.show();

            $.ajax({
                url: 'https://openexchangerates.org/api/currencies.json',
                method: 'GET',
                timeout: 4000
            })
            .done(function(currencies) {

                for(currency in currencies) {

                    let newOption = $('<option></option>');
                    newOption.text(currencies[currency]);
                    newOption.attr('value', currency);
                    
                    $('.select1, .select2').append(newOption);

                }

                // Hide the spinner
                spinner.hide();

                // Convert eur to mkd
                var eur = select1.find($('option')).filter('[value="EUR"]');
                var mkd = select2.find($('option')).filter('[value="MKD"]');
                eur.attr('selected','');
                mkd.attr('selected','');
                input1.val(1);
                calculate(input1);

            })
            .fail(function(err) {
                
                // Hide the spinner
                spinner.hide();

                let string = $('<p></p>');
                string.text('Can\'t get access to currencies');
                string.addClass('stringSelect');
                select1.before(string);

            })
        }

    }

    // Calculate
    function calculate(inputField) {
        
        var convertWindow = $('.convert_window');
        var outputField = inputField.siblings('input');
        var value = inputField.val();
        var fromRate = 0;
        var toRate = 0;
        var spinner = $('.spinner.one');
        
        // Remove previous result
        let string = $('.stringConvert');
        string.remove();
        
        // If the field is empty, or it isn't a number, or there was problem getting currencies
        if (value.length < 1 || isNaN(value) || $('.stringSelect').length > 0) { 
            
            outputField.val('');
            let string = $('<p></p>')
            string.addClass('stringConvert');

            if (isNaN(value) == true) {

                string.text('Valid numbers only!')

            } else if ($('.stringSelect').length > 0) {

                string.text('Can\'t get access to currencies');

            } else {

                string.text('Result here.');

            }

            convertWindow.append(string);
            return
            
        };

        // Conversion direction
        if (inputField.hasClass('input1')) {

            var fromCurrency = select1.val();
            var toCurrency = select2.val();

        } else {

            var fromCurrency = select2.val();
            var toCurrency = select1.val();

        }
        
        // Use new data if needed
        var oldTimestampElem = $('.timestamp');
        var timestampMs = Number(oldTimestampElem.attr('data-utc'));

        if ((oldTimestampElem.length < 1) || (timestampMs + 3900000 < Date.now())) {
            
            // Show the spinner
            spinner.show();

            var appId = '639ecf153c634cfab7dab275a5b6921e';
            var myurl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
            
            $.ajax({
                url: myurl,
                method: 'GET',
                dataType: 'json',
                timeout: 4000
            })
            .done(function(returnValue) {

                // Received timestamp 
                timestampMs = Number(returnValue.timestamp) * 1000;
                var d = new Date(0);
                d.setUTCMilliseconds(timestampMs);

                // Create new timestamp or update the old one
                if (oldTimestampElem.length < 1) {

                    let newTimestampElem = $('<span></span>');
                    newTimestampElem.addClass('timestamp');
                    newTimestampElem.attr('data-utc', timestampMs)
                    newTimestampElem.text('Updated: ' + d.toLocaleTimeString());
                    $('body').prepend(newTimestampElem);

                } else {

                    oldTimestampElem.attr('data-utc', timestampMs);
                    oldTimestampElem.text('Updated: ' + d.toLocaleTimeString());

                }
                
                // Update rates
                rates = returnValue.rates

                // Calculate the result with new data
                fromRate = Number(rates[fromCurrency])
                toRate = Number(rates[toCurrency]);
                var endResult = value / fromRate * toRate;
                endResult = +endResult.toFixed(4)

                // Display the result
                outputField.val(endResult);
                $('.stringConvert').remove();
                let string = $('<p></p>')
                string.addClass('stringConvert');
                string.text(value + ' ' + fromCurrency + ' = ' + endResult + ' ' + toCurrency);
                convertWindow.append(string);
                spinner.hide();
                
            })
            .fail (function(err) {

                let string = $('<p></p>')
                string.addClass('stringConvert');
                string.text('Can\'t get access to rates');
                convertWindow.append(string);
                spinner.hide();
                
            })
        
        // Use cached data
        } else {

            // Calculate the result with cached data
            fromRate = Number(rates[fromCurrency])
            toRate = Number(rates[toCurrency]);
            endResult = value / fromRate * toRate;
            endResult = +endResult.toFixed(4)

            // Display the result
            outputField.val(endResult);
            $('.string').remove();
            let string = $('<p></p>');
            string.addClass('stringConvert');
            string.text(value + ' ' + fromCurrency + ' = ' + endResult + ' ' + toCurrency);
            convertWindow.append(string);
            spinner.hide();

        }

    }

    // Populate List page
    function populateListPage() {

        homePage.hide();
        convertPage.hide();
        listPage.show();

        $('html').scrollTop(0);

        // Highlight the nav button
        var navButtons = $('.nav').children('a');
        navButtons.removeClass('active');
        var navListButton = navButtons.filter('.list');
        navListButton.addClass('active');

        let string = $('.stringList');
        string.remove();

        var oldRatesElem = $('.rates');
        var spinner = $('.spinner.two');

        // Use new data if needed
        var oldTimestampElem = $('.timestamp');
        var timestampMs = Number(oldTimestampElem.attr('data-utc'));

        if ((oldTimestampElem.length < 1) || (timestampMs + 3900000 < Date.now())){
            
            // Remove old rates and show the spinner
            oldRatesElem.remove();
            spinner.show();

            var appId = '639ecf153c634cfab7dab275a5b6921e'
            var myurl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`

            $.ajax({
                url: myurl,
                method: 'GET',
                dataType: 'json',
                timeout: 4000
            })
            .done(function (returnValue) {

                // Received timestamp
                timestampMs = Number(returnValue.timestamp) * 1000;
                var d = new Date(0);
                d.setUTCMilliseconds(timestampMs);

                // Create new timestamp or update the old one
                if (oldTimestampElem.length < 1) {

                    let newTimestampElem = $('<span></span>');
                    newTimestampElem.addClass('timestamp');
                    newTimestampElem.attr('data-utc', timestampMs)
                    newTimestampElem.text('Updated: ' + d.toLocaleTimeString());
                    $('body').prepend(newTimestampElem);

                } else {

                    oldTimestampElem.attr('data-utc', timestampMs);
                    oldTimestampElem.text('Updated: ' + d.toLocaleTimeString());

                }

                // Update rates
                rates = returnValue.rates;

                // Create new rates elements with new data
                var newRatesElem = $('<div></div>');
                newRatesElem.addClass('rates');
                
                for (rate in rates) {
                    
                    let elem = $('<div></div>');
                    elem.addClass('currency_rates');
                    let currencyElem = $('<div></div>');
                    currencyElem.addClass('currency');
                    currencyElem.text(rate);
                    let rateElem = $('<div></div>');
                    rateElem.addClass('rate');
                    rateElem.text(+rates[rate].toFixed(4));
                    elem.append(currencyElem).append(rateElem);
                    newRatesElem.append(elem);
                    
                }

                listPage.append(newRatesElem);
                
                // Hide the spinner and clear the search
                spinner.hide();
                searchField.val('');
                
            })
            .fail(function(err) {

                spinner.hide();
                let string = $('<p></p>')
                string.addClass('stringList');
                string.text('Can\'t get access to rates');
                listPage.append(string);

            })

         // Use cached data to create new rates elements
        } else if (oldRatesElem.length < 1) {
            
            var newRatesElem = $('<div></div>');
            newRatesElem.addClass('rates');

            for (rate in rates) {
                    
                let elem = $('<div></div>');
                elem.addClass('currency_rates');
                let currencyElem = $('<div></div>');
                currencyElem.addClass('currency');
                currencyElem.text(rate);
                let rateElem = $('<div></div>');
                rateElem.addClass('rate');
                rateElem.text(+rates[rate].toFixed(4));
                elem.append(currencyElem).append(rateElem);
                newRatesElem.append(elem);

            }

            listPage.append(newRatesElem);
                
            // Hide the spinner and clear the search
            spinner.hide();
            searchField.val('');

        }

    }

    // Swap
    function swap() {

        // If the selection lists are empty
        if (select1.children('option').length < 1) {
            return
        }

        // Swap the selection lists
        selectWindow.prepend(select2);
        select2.attr('class', 'select1');
        selectWindow.append(select1);
        select1.attr('class', 'select2');

        // Update the references
        select1 = $('.select1');
        select2 = $('.select2');
        
        // Re-calculate
        calculate(input1);

    }

    // Search
    function search(searchField) {

        var value = searchField.val().toUpperCase();
        var currencyRates = $('.currency_rates');
        
        var string = $('.stringList');
        string.remove()

        // Show or hide currency items
        currencyRates.each(function(i, currencyRate) {

            let currencyElem = $(currencyRate).children('.currency');

            if (currencyElem.text().indexOf(value) > -1) {

                $(currencyRate).show()

            } else {

                $(currencyRate).hide()

            }

        })

        var invisibleCurrencyRates = currencyRates.filter('[style="display: none;"]');
        
        // If there is no match
        if(invisibleCurrencyRates.length == currencyRates.length) {

            let string = $('<p></p>');
            string.addClass('stringList');
            string.text('No match');
            listPage.append(string);
        }

    }

    // Show 'to top' button
    function showToTopButton() {
        
        if ($(window).scrollTop() > 100) {

            toTopButton.fadeIn(200);
            
        } else {
            
            toTopButton.fadeOut(200);
            
        }

        if($(window).scrollTop() > 0) {
            
            navbar.addClass('shadow');

        } else {

            navbar.removeClass('shadow');

        }
        
    }

    // Scroll to top
    function scrollToTop() {

        $('html').animate({scrollTop: '0'}, 500);

    }

})
    
