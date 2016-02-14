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
            console.log('REC LIST------',$scope.recList);
        })
    };
    $scope.currSort = 'output_item_name';
    $scope.revSort = false;
    $scope.sortRows = function(rowName) {
        if (rowName == $scope.currSort) {
            $scope.revSort = !$scope.revSort;
        } else {
            $scope.currSort = rowName
            $scope.revSort = false;
        }
    };
    $scope.getInitialItemList = function(srch) {
        //use a search term to search gw2spidy for an item;
        $scope.initItems = [];
        $.get('https://www.gw2spidy.com/api/v0.9/json/item-search/' + srch, function(res) {
            for (var j = 0; j < res.results.length; j++) {
                //look thru all the items to see if this item's already there.
                var hasDup = false;
                for (var q = 0; q < $scope.initItems.length; q++) {
                	if ($scope.initItems[q].id==res.results[j].data_id){
                		hasDup=true;
                	}
                }
                if (!hasDup) {
                    $scope.initItems.push({
                        name: res.results[j].name,
                        price: res.results[j].min_sale_unit_price,
                        id: res.results[j].data_id
                    })
                }
            }
            $scope.$digest();
        })
    };
    $scope.getInitialItemList('potato');
    $scope.getInitialTimer = function() {
        $scope.initItems = [];
        $scope.t = setTimeout($scope.getInitialItemList($scope.itemSearchTxt), 1000);
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
        document.title =  $scope.whichItem.name + ' - Gw2 Price Checker';
        console.log('this was triggered, ', $scope.whichItem, typeof $scope.whichItem)
        $.ajax({
            url: 'https://api.guildwars2.com/v2/recipes/search?input=' + $scope.whichItem.id,
            type: 'GET',
            dataType: 'json',
            success: function(recRes) {
                //now we've got a list of recipes made with this item. Need
                //to get actual recipe data tho.
                $scope.getRecList(recRes);
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
});
app.filter('pricey', function() {
    //formats price in g,s,c format
    return function(price) {
        var isNeg = false;
        price = price.toString();
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
