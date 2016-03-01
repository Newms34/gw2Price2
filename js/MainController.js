var app = angular.module("price2", ['ngAnimate']);

app.controller("MainController", function($scope, $window, $q, itemInf) {
    $scope.initItems = [];
    $scope.recList = [];
    $scope.t;
    $scope.working = false; //if this is true, stuff's fuzzed out. Lets user know we're still working
    $scope.getItemNames = function(itemArr) {
        var itemPromArr = [];
        for (var i = 0; i < itemArr.length; i++) {
            itemPromArr.push($.ajax({
                url: 'https://www.gw2spidy.com/api/v0.9/json/item/' + itemArr[i],
                type: 'GET',
                dataType: 'json'
            }));
        }
        $q.all(itemPromArr).then(function(nom) {
            //now we go thru all items and give them names, prices, pics. 
            //how nice.
            console.log('NOM', nom)
            for (var n = 0; n < $scope.recList.length; n++) {
                //first output item gets a name
                $scope.recList[n].isActive = false;
                for (var q = 0; q < nom.length; q++) {
                    //find name;
                    if ($scope.recList[n].output_item_id == nom[q].result.data_id) {
                        $scope.recList[n].output_item_name = nom[q].result.name;
                        $scope.recList[n].output_item_pic = nom[q].result.img;
                        $scope.recList[n].output_item_price = nom[q].result.min_sale_unit_price;
                    }
                }
                //now each ingred gets a name;
                for (var m = 0; m < $scope.recList[n].ingredients.length; m++) {
                    for (var q = 0; q < nom.length; q++) {
                        //find name;
                        if ($scope.recList[n].ingredients[m].item_id == nom[q].result.data_id) {
                            $scope.recList[n].ingredients[m].item_name = nom[q].result.name;
                            $scope.recList[n].ingredients[m].item_pic = nom[q].result.img;
                            $scope.recList[n].ingredients[m].item_price = nom[q].result.min_sale_unit_price;
                            $scope.recList[n].ingredients[m].isDeriv = nom[q].result.result_of.length ? 1 : 0;
                        }
                    }
                }
                //finally, calc profit:
                $scope.recList[n].profit = $scope.calcProf($scope.recList[n]);
            }
            //last step: send stuff to itemInf factory
            //there's gotta be an easier way than injecting the entire scope in here
            itemInf.getInfo($scope.recList, $scope, $q);
            console.log('REC LIST------', $scope.recList);
            for (n = 0; n < $scope.recList.length; n++) {
                console.log('Recipe for ' + $scope.recList[n].output_item_name + ' is made by ' + $scope.recList[n].disciplines)
            }
        })
    };
    $scope.currSort = 'output_item_name';
    $scope.adjOmit = function() {

    }
    $scope.omit = {};
    $scope.itemNo = [{
        id: 0,
        name: "Armor",
        pic: '\uD83D\uDC55'
    }, {
        id: 19,
        name: "Back",
        pic: '\uD83D\uDCB0'
    }, {
        id: 2,
        name: "Bag",
        pic: '\uD83D\uDCBC'
    }, {
        id: 3,
        name: "Consumable",
        pic: '\uD83C\uDF54'
    }, {
        id: 4,
        name: "Container",
        pic: '\uD83D\uDCE6'
    }, {
        id: 5,
        name: "Crafting Material",
        pic: '\uD83C\uDF42'
    }, {
        id: 6,
        name: "Gathering",
        pic: '\uD83C\uDF32'
    }, {
        id: 7,
        name: "Gizmo",
        pic: '\u2699'
    }, {
        id: 11,
        name: "Mini",
        pic: '\uD83D\uDC01'
    }, {
        id: 13,
        name: "Tool",
        pic: '\u2692'
    }, {
        id: 15,
        name: "Trinket",
        pic: '\uD83D\uDC8D'
    }, {
        id: 16,
        name: "Trophy",
        pic: '\uD83C\uDFC6'
    }, {
        id: 17,
        name: "Upgrade Component",
        pic: '\uD83D\uDC8E'
    }, {
        id: 18,
        name: "Weapon",
        pic: '\u2694'
    }]
    https: //render.guildwars2.com/file/2952B92FA93C03A5281F94D223A4CE4C7E0B0906/102461.png
        $scope.revSort = false;
    $scope.sortRows = function(rowName) {
        if (rowName == $scope.currSort) {
            $scope.revSort = !$scope.revSort;
        } else {
            $scope.currSort = rowName
            $scope.revSort = false;
        }
    };
    $scope.getInitialItemList = function(srch, page) {
        //use a search term to search gw2spidy for an item;
        if (page < 2) {
            $scope.initItems = [];
        }
        $.get('https://www.gw2spidy.com/api/v0.9/json/item-search/' + srch + '/' + page, function(res) {
            for (var j = 0; j < res.results.length; j++) {
                //look thru all the items to see if this item's already there.
                var hasProb = false;
                for (var q = 0; q < $scope.initItems.length; q++) {
                    if ($scope.initItems[q].name == res.results[j].name) {
                        hasProb = true;
                    }
                }
                if ($scope.omit[res.results[j].type_id]) {
                    console.log('type', res.results[j].type_id, 'is omitted')
                    hasProb = true;
                }
                if (!hasProb) {
                    $scope.initItems.push({
                        name: res.results[j].name,
                        price: res.results[j].min_sale_unit_price,
                        id: res.results[j].data_id
                    })
                }
            }
            if (res.page < res.last_page) {
                page++;
                $scope.getInitialItemList($scope.itemSearchTxt, page);
            } else {
                console.log('final result:', res);
                $scope.$digest();
            }
        });
    };
    $scope.getInitialItemList('potato', '1');
    $scope.getInitialTimer = function() {
        $scope.initItems = [];
        $scope.t = null;
        $scope.t = setTimeout($scope.getInitialItemList($scope.itemSearchTxt, '1'), 1000);
    }
    $scope.getDeriv = function(der) {
        //only item is the one we clicked
        $scope.initItems = [{
            name: der.item_name,
            id: der.item_id,
            price: der.item_price
        }]
        $('#derivWarnBox').css({
            'opacity': 0
        })
        $scope.whichItem = $scope.initItems[0];
        $scope.getRecipeList();
    }
    $scope.getRecipeList = function() {
        $scope.working = true;
        if (typeof $scope.whichItem == 'string') {
            $scope.whichItem = JSON.parse($scope.whichItem);
        }
        document.title = $scope.whichItem.name + ' - Gw2 Price Checker';
        console.log('this was triggered, ', $scope.whichItem, typeof $scope.whichItem)
        $.ajax({
            url: 'https://api.guildwars2.com/v2/recipes/search?input=' + $scope.whichItem.id,
            type: 'GET',
            dataType: 'json',
            success: function(recRes) {
                //now we've got a list of recipes made with this item. Need
                //to get actual recipe data tho.
                console.log('recRes', recRes)
                if (recRes.length) {
                    $scope.getRecList(recRes);
                } else {
                    alert('no recs!');
                    $scope.working = false;
                    $scope.$digest();
                }
            }
        });
    }
    $scope.getRecList = function(arr) {
        var recArr = [];
        for (var n = 0; n < arr.length; n++) {
            recArr.push($.ajax({
                url: 'https://api.guildwars2.com/v2/recipes/' + arr[n],
                type: 'GET',
                dataType: 'json'
            }));
        }
        $q.all(recArr).then(function(res) {
            $scope.recList = res;
            $scope.popNames();
        })
    }
    $scope.popNames = function() {
        var ids = []
        for (var i = 0; i < $scope.recList.length; i++) {
            //output first
            if (ids.indexOf($scope.recList[i].output_item_id) == -1) {
                ids.push($scope.recList[i].output_item_id);
            }
            //now ingreds
            for (var j = 0; j < $scope.recList[i].ingredients.length; j++) {
                if (ids.indexOf($scope.recList[i].ingredients[j].item_id) == -1) {
                    ids.push($scope.recList[i].ingredients[j].item_id);
                }
            }
        }
        $scope.getItemNames(ids);
    }
    $scope.calcProf = function(rec) {
        //calculate potential profit!
        var sellPrice = rec.output_item_price * rec.output_item_count;
        var buyPrice = 0;
        for (var f = 0; f < rec.ingredients.length; f++) {
            //for each ingredient, add its cost times its req quantity
            buyPrice += rec.ingredients[f].count * rec.ingredients[f].item_price;
        }
        return sellPrice - buyPrice;
    }
    $scope.x = 0;
    $scope.y = 0;
    window.onmousemove = function(e) {
        $scope.x = e.x || e.clientX;
        $scope.y = (e.y || e.clientY) + 10;
    }
    $scope.showBlurb = function(i, t, m) {
        //i = item, t = warning or description, m = in or out
        console.log(i, 'mode', m)
        if (!m) {
            $('#derivWarnBox').css({
                'left': $scope.x + 'px',
                'top': $scope.y + 'px',
                'opacity': 1
            })
            if (t) {
                $('#derivWarnBox').html('<b>' + i.item_name + '</b> is the result of a recipe. Click to view what <i>other</i> items it might be used in!')
            } else if (i.blurbDesc || i.blurbAttribs) {
                var blurbStr = '';
                if (i.blurbDesc && i.blurbDesc != '') {
                    blurbStr += i.blurbDesc + '<br/>';
                }
                for (var q = 0; q < i.blurbAttribs.length; q++) {
                    blurbStr += i.blurbAttribs[q] + '<br/>';
                }
                $('#derivWarnBox').html(blurbStr);
            } else {
                $('#derivWarnBox').css({
                    'opacity': 0
                })
            }
        } else {
            $('#derivWarnBox').css({
                'opacity': 0
            })
        }
    }
    $scope.scrollTime = undefined;
    $scope.scrollMe = function(e) {
        var vertPos = e.offsetY / 200;
        console.log(parseInt($('#noItTab').scrollTop()), $scope.scrollTime, e)
        if (vertPos < .20 && parseInt($('#noItTab').scrollTop()) > 1 && !$scope.scrollTime) {
            $scope.scrollTime = setInterval(function() { $('#noItTab').scrollTop($('#noItTab').scrollTop() - .1) }, 20);
        } else if (vertPos > .80 && !$scope.scrollTime) {
            $scope.scrollTime = setInterval(function() { $('#noItTab').scrollTop($('#noItTab').scrollTop() + .1) }, 20);
        } else if (vertPos < .8 && vertPos > .2) {
            clearInterval($scope.scrollTime);
            $scope.scrollTime = undefined;
        }
    }
    $scope.discs = {
        'Chef': {
            url: 'https://render.guildwars2.com/file/424E410B90DE300CEB4A1DE2AB954A287C7A5419/102465.png',
            title: 'Cook'
        },
        'Artificer': {
            url: 'https://render.guildwars2.com/file/0D75999D6DEA1FDFF9DB43BBC2054B62764EB9A0/102463.png',
            title: 'Artificer'
        },
        'Jeweler': {
            url: 'https://render.guildwars2.com/file/F97F4D212B1294052A196734C71BCE42E199735B/102458.png',
            title: 'Jeweler'
        },
        'Weaponsmith': {
            url: 'https://render.guildwars2.com/file/AEEF1CF774EE0D5917D5E1CF3AAC269FEE5EC03A/102460.png',
            title: 'Weaponsmith'
        },
        'Huntsman': {
            url: 'https://render.guildwars2.com/file/0C91017241F016EF35A2BCCE183CA9F7374023FC/102462.png',
            title: 'Huntsman'
        },
        'Armorsmith': {
            url: 'https://render.guildwars2.com/file/2952B92FA93C03A5281F94D223A4CE4C7E0B0906/102461.png',
            title: 'Armorsmith'
        },
        'Leatherworker': {
            url: 'https://render.guildwars2.com/file/192D1D0D73BA7899F1745F32BAC1634C1B4671BF/102464.png',
            title: 'Leatherworker'
        },
        'Tailor': {
            url: 'https://render.guildwars2.com/file/0EB64958BE48AB9605DD56807713215095B8BEED/102459.png',
            title: 'Tailor'
        },
        'Scribe': {
            url: 'https://wiki.guildwars2.com/images/0/0b/Scribe_tango_icon_20px.png',
            title: 'Scribe'
        }
    };
    $scope.getDiscp = function(disObj) {
        return $scope.discs[disObj] || {
            url: 'https://render.guildwars2.com/file/A5DE06130C0D1E2C9A9780EAD037E61462B1E825/102597.png',
            title: 'Unknown'
        }
    }
});
app.filter('pricey', function() {
    //formats price in g,s,c format
    return function(price) {
        var isNeg = false;
        try {
            price = price.toString();
        } catch (e) {
            console.log(e, price)
        }
        price = price.split(''); //convert price to an array;
        if (price[0] == '-') {
            //chop off initial neg if price <0
            price.shift();
            isNeg = true;
        }
        var len = price.length;
        price.push('c'); //all prices end in 'c'
        if (len > 2) {
            //price has silver
            price.splice(-3, 0, 's ');
        }
        if (len > 4) {
            price.splice(-6, 0, 'g ');
        }
        if (isNeg) {
            price.unshift('-');
        }
        return price.join('');
    };
});

/*price:
[1,2]: len = 2, +c
[1,2,3,4]: len = 4, +c, +s
[1,2,3,4,5,6++] len = 6+, +g, +c, +s, 
*/
