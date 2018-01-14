$(document).ready(function() {
    
    var homeButton = $('.home');
    var convertButton = $('.convert');
    var listButton = $('.list');
    var timestampElem = $('.timestamp');
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
    
    var currenciesCheck = null;
    var rates = null;
    var timestamp = null;

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

    // Check for local storage availability
    function storageAvailable(type) {

        try {

            var storage = window[type];
            var x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;

        } catch(e) {

            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage.length !== 0;
                
        }

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

        // If there aren't any currencies
        if (currenciesCheck !== 'populated') {
            
            var spinner = $('.spinner.zero');
            spinner.show();

            $.ajax({
                url: 'https://openexchangerates.org/api/currencies.json',
                method: 'GET',
                timeout: 4000
            })
            .done(function(currencies) {
                console.log('currencies request')

                currenciesCheck = 'populated';

                // Display the new currencies
                for(currency in currencies) {

                    let newOption = $('<option></option>');
                    newOption.text(currencies[currency]);
                    newOption.attr('value', currency);
                    
                    $('.select1, .select2').append(newOption);

                }

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
                
                // Display error string
                let string = $('<p></p>');
                string.text('Can\'t get access to currencies');
                string.addClass('stringSelect');
                select1.before(string);

                spinner.hide();
                
            })

        }

    }

    function conditionRates() {

        // Cached rates up to date
        if (rates !== null && timestamp + 3900000 >= Date.now()) {

            return 'up to date'
        
        // Cached rates outdated
        } else if (rates !== null && timestamp + 3900000 < Date.now()) {

            return 'outdated'

        // No cached rates, local storage unavailable
        } else if (rates === null && !storageAvailable('localStorage')) {

            return 'no local storage'
        
        // No cached rates, local storage available, local storage empty
        } else if (rates === null && storageAvailable('localStorage') && !localStorage.getItem('rates')) {

            return 'local storage empty'

        // No cached rates, local storage available, local storage populated
        } else if (rates === null && storageAvailable('localStorage') && localStorage.getItem('rates')) {

            return 'local storage populated'

        }

    };

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
        
        // If the field is empty, or it isn't a number, or there aren't any currencies
        if (value.length < 1 || isNaN(value) || $('.stringSelect').length > 0) { 
            
            outputField.val('');

            let string = $('<p></p>')
            string.addClass('stringConvert');

            if (isNaN(value) === true) {

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
        
        switch (conditionRates()) {

            case 'up to date':

                // Update the timestamp element
                var timestampDate = new Date(0);
                timestampDate.setUTCMilliseconds(timestamp);
                timestampElem.text(timestampDate.toLocaleTimeString())
                
                // Calculate the result
                fromRate = Number(rates[fromCurrency]);
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

                break;

            case 'outdated':
            case 'no local storage':
            case 'local storage empty':

                spinner.show();

                let appId = '639ecf153c634cfab7dab275a5b6921e';
                let myurl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
                
                $.ajax({
                    url: myurl,
                    method: 'GET',
                    dataType: 'json',
                    timeout: 4000
                })
                .done(function(returnValue) {
                    console.log('rates request')

                    // Update timestamp
                    var ms = Number(returnValue.timestamp) * 1000;
                    timestamp = ms;

                    // Update rates
                    var newRates = returnValue.rates;
                    rates = newRates;
                    
                    // Update the local storage if available
                    if (storageAvailable('localStorage')) {

                        localStorage.setItem('timestamp', ms);
                        localStorage.setItem('rates', JSON.stringify(newRates));

                    }

                    calculate(inputField);
                    spinner.hide();

                })
                .fail(function(err) {

                    // Display error string
                    let string = $('<p></p>')
                    string.addClass('stringConvert');
                    string.text('Can\'t get access to rates');
                    convertWindow.append(string);

                    spinner.hide();

                })

            case 'local storage populated':

                var storageRates = localStorage.getItem('rates');
                var storageTimestamp = localStorage.getItem('timestamp');

                rates = JSON.parse(storageRates);
                timestamp = Number(storageTimestamp)
                calculate(inputField);

        }

    }
    
    // Populate List Page
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

        switch (conditionRates()) {

            case 'up to date':

                // Update the timestamp element
                var timestampDate = new Date(0);
                timestampDate.setUTCMilliseconds(timestamp);
                timestampElem.text(timestampDate.toLocaleTimeString());

                // If there are no rates elements displayed
                if (oldRatesElem.length === 0) {

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

                }

                break;

            case 'outdated':
            case 'no local storage':
            case 'local storage empty':

                spinner.show();

                let appId = '639ecf153c634cfab7dab275a5b6921e';
                let myurl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`;
                
                $.ajax({
                    url: myurl,
                    method: 'GET',
                    dataType: 'json',
                    timeout: 4000
                })
                .done(function(returnValue) {
                    console.log('rates request')

                    // Update timestamp
                    var ms = Number(returnValue.timestamp) * 1000;
                    timestamp = ms;

                    // Update rates
                    var newRates = returnValue.rates;
                    rates = newRates;
                    
                    // Update the local storage if available
                    if (storageAvailable('localStorage')) {

                        localStorage.setItem('timestamp', ms);
                        localStorage.setItem('rates', JSON.stringify(newRates));

                    }

                    // Remove outdated rates elements if there are any
                    oldRatesElem.remove();

                    populateListPage();
                    searchField.val('');
                    spinner.hide();
                    
                })
                .fail(function(err) {

                    // Display error string
                    let string = $('<p></p>')
                    string.addClass('stringList');
                    string.text('Can\'t get access to rates');
                    listPage.append(string);

                    spinner.hide();
                    
                })

                break;
        
            case 'local storage populated':

                let storageTimestamp = localStorage.getItem('timestamp');
                let storageRates = localStorage.getItem('rates');

                rates = JSON.parse(storageRates);
                timestamp = Number(storageTimestamp)
                populateListPage();

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
        if (invisibleCurrencyRates.length === currencyRates.length) {

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

        // Show shadow on navbar
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
    
