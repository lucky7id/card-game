/*
  # Programming Proficiency Test

  Assumes basic JavaScript knowledge; jQuery knowledge helps a lot.

  ## Exercises

  1. Clicking the button should generate two random hands in memory (console.log).
  2. Clicking the button should render two random hands on the page as cards.
  3. Determine the winning hand by its number of pairs, add class="winning" to hand.
  4. Determine winning pairs and add class="pair0" (or "pair1" for 2nd pair) to cards.
  5. [Extra Credit] Ensure that 90% of hands have at least one pair.

*/

window.Poker = (function($) {

    var cardBaseURL = "http://h3h.net/images/cards/{suit}_{card}.svg";
    var suits = ['spade', 'heart', 'diamond', 'club'];
    var cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    var hands = [];
    var $board;
    var $control;

    // *-* public methods *-*

    var init = function() {
        hands = [];
        hands.push(makeHand(5));
        hands.push(makeHand(5, hands[0]));
        console.log(hands);
        render(getIndexOfPairs(hands));
        $control = $(".buttons button");
        $control.attr('disabled', false);
        $control.on("click", eventPlayAgainClicked);
    };

    var _without = function(elm, arr){
        var temp = [].concat(arr);
        var i = temp.indexOf(elm);

        temp.splice(i, 1);

        return temp;
    };

    // *-* utility methods *-*

    /**
     * makeHand will make a hand of specified length
     * if deck is supplied it will be concatenated for dupe checking
     * this makes the deck dynamic, so it does not need to be completely generated up front
     * @param  {int}    num     length the hand should be
     * @param  {array}  deck    optional, used for dupe checking
     * @return {array}          a new hand
     */
    var makeHand = function(num, deck) {
        //recursion is the most elegant solution here
        //the concession is: it will be slower than doing a dynamic table
        //also dupe checking on the fly makes this slower at scale.
        deck = deck || [];
        var newHand = [].concat(deck);
        function hand(num, card, arr) {
            var newCard = makeCard();

            //last index break
            if (num === 0) {
                return arr;
            }

            //if a dupe is found, retry
            if (cardIsDupe(arr, newCard) && arr.length !== 52) {

                return hand(num, card, arr);
            } else {
                // no dupe, add to the hand, move to the next iteration
                arr.push(newCard);

                return hand(num - 1, newCard, arr);
            }

            //if the sky falls, we end up here, better return
            arr.push(newCard);

            return arr;
        }

        //take the newly generated
        return hand(num || 5, makeCard(), newHand).slice(deck.length, deck.length + num);

    };

    var getWinner = function() {
        var pairsGroups = getIndexOfPairs(hands);
        var winner;

        //[hand[pair[i, i], pair[i,i]], hand[[]]]
        var winningHandVal = pairsGroups.map(function(pair, i) {
            //[pair[i, i], pair[i,i]]
            return pair.map(function(val){

                //return card value based on index * # of occurances
                return cards.indexOf(hands[i][val[0]].card) * val.length;
            })
            .reduce(function(prev, cur, i, arr) {
                //this reduce will reduce all pairs to a single point val
                //otherwise return the first val
                if(arr.length === 1) {
                    return cur;
                }

                return prev + cur;
            }, -1);
        }).reduce(function(prev, cur, i, arr) {
            //when we get here each hand should be mapped to a single value[val, val]
            if (prev === cur) {
                //the final val should equal -1 if no pairs exist
                return -1;
            }

            //apply lets us pass an array to be used as <arguments>
            winner = arr.indexOf(Math.max.apply(null, arr));
            return Math.max.apply(null, arr);
        }, -1);

        if (typeof winner !== 'undefined') {
            return 'player' + winner;
        }

        return false;
    };

    var getIndexOfPairs = function(hands) {
        return hands
            .map(function(hand) {
                return findInHand(handContainsPair(hand), hand);
            });
    };

    var findInHand = function(toFind, hand) {
        return toFind
            .map(function(pairCard) {
                var indexes = [];

                hand.map(function(card, index) {

                    if (card.card === pairCard) {
                        indexes.push(index);
                    }

                    return card;
                });

                return indexes;
            });
    };

    var handContainsPair = function(hand) {
        var pairs = hand
            .map(function(card){

                return card.card;
            })
            .filter(function(num, index, arr){
                var temp = _without(num, arr);

                return temp.indexOf(num, index) !== -1;
            });

        return pairs || [];
    };

    var render = function(pairs) {
        var $game = $('<div class="game"></div>');
        var winner = getWinner();

        for (var i = 0; i < hands.length; i++) {
            var $hand = $('<section class="hand player' + i + '"><section>');
            var title = '<h1>Player ' + (i + 1) + ' </h1>';

            hands[i] = hands[i].map(setCardUrl);
            $hand.append(title);
            $hand.append(getHandImgs(hands[i], pairs[i]));
            $game.append($hand);
        }

        $board = $('#game-container').html($game);

        if (winner) {
            $board.find('.hand.' + winner).addClass('winning');
        }

        return $game;
    };

    var getPairClass = function(index, pairs, hand) {
        var pairClass = 'card ';

        for (var i = 0; i < pairs.length; i++) {
            if (pairs[i].indexOf(index) !== -1) {
                pairClass += 'pair' + i + ' ';
            }
        }

        return pairClass;
    };

    var getHandImgs = function(hand, pairs) {
        var str = '';
        var img = '<img src="{src}" class="{class}"/>';

        for (var i = 0; i < hand.length; i++) {
            var pairClass = getPairClass(i, pairs, hand);
            var tempImg = img.replace(/\{src\}/, hand[i].img).replace(/\{class\}/, pairClass);

            str += tempImg;
        }

        return str;
    };

    var setCardUrl = function(card){
        card.img = cardBaseURL.replace(/\{suit\}/, card.suit).replace(/\{card\}/, card.card);

        return card;
    };

    var makeCard = function() {
        var suit = suits[getRandIndex(suits)];
        var card = cards[getRandIndex(cards)];

        return {
            card: card,
            suit: suit
        };
    };

    var cardIsDupe = function(hand, newCard) {
        var isDupe = false;

        for (var i = 0; i < hand.length; i++) {
            var handCard = hand[i];
            var suitsMatch = handCard.suit === newCard.suit;
            var cardsMatch = handCard.card === newCard.card;
            var isMatch = suitsMatch && cardsMatch;

            if (isMatch) {
                isDupe = true;
                return isDupe;
            }
        }

        return isDupe;
    };

    var getRandIndex = function(arr) {

        return Math.floor(Math.random() * arr.length);
    };

    // *-* event methods *-*

    var eventPlayAgainClicked = function() {
        $control.off('click');
        $control.attr('disabled', true);
        init();
    };

    // expose public methods
    return {
        init: init
    };
})(jQuery);

$(document).ready(window.Poker.init);

/*

The MIT License

Copyright (c) 2012 Brad Fults.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/
