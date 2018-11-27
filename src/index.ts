import {Game} from "./Game";
import {Player} from "./Player";
import Card from "./Card";
import {Uno} from "./Uno";
import {Collection} from "collect.js";

let uno = exports;

uno.Game = Game;
uno.Card = Card;
uno.Player = Player;
uno.Core = Uno;

let game = Game.newGame();

game.on(Game.Events.PlayerDrewCard, (player: Player, card: Card) => {
    console.log(`${player.name} has drawn ${card.toString()}. P: ${ player.cardsInHand } D: ${ game.cardsInDeck } G: ${ game.cardsInDiscard }`);
});

game.on(Game.Events.PlayerPlayedCard, (player: Player, card: Card) => {
    console.log(`${player.name} has played ${card.toString()}. P: ${ player.cardsInHand } D: ${ game.cardsInDeck } G: ${ game.cardsInDiscard }`);
});

game.on(Game.Events.ColorWasSet, (color: Card.Color) => {
    console.log(`Active Color set to ${color}.`);
});

game.on(Game.Events.GameEnded, (winner: Player) => {
    console.log(`${winner.name} won the game after ${game.turn} turns.`);
});

game.on(Game.Events.TurnAdvanced, (turn: number, player: Player) => {
    console.log(`turn ${turn} is ${player.name}'s turn.`);
});

game.on(Game.Events.PlayerSkipped, (player: Player) => {
    console.log(`${player.name}'s turn was skipped`);
});

game.on(Game.Events.PlayReversed, (player: Player) => {
    console.log(`Play has reversed direction. ${player.name} is up next.`);
});

game.on(Game.Events.GameStarted, (game: Game, players: Collection<Player>) => {
    console.log(`----------------------------`);
    console.log(`Game has started with ${players.count()} players.`);

    let turn = 0;
    while (!game.gameHasEnded) {
        turn++;

        let player = game.currentPlayer;
        let playableCards = game.currentPlayer.validCards(game.currentCard);

        let cardToPlay;
        if (playableCards.count() === 0) {
            cardToPlay = game.playerDrawsACard(player, false);

            if (!cardToPlay || (cardToPlay && !cardToPlay.isValidAgainst(game.currentCard))) {
                continue;
            }
        } else {
            cardToPlay = playableCards.first()
        }

        if (cardToPlay) {
            let color;
            switch (cardToPlay.type) {
                case Card.Type.Wild:
                case Card.Type.Wild_Draw:
                    color = Uno.CARD_COLORS[Math.floor(Math.random() * Uno.CARD_COLORS.length)];
                    break;
            }

            game.playerPlaysACard(player, cardToPlay, color);
        }
    }

    console.log(game.eventStack);
});

let player1 = new Player('Bob');
let player2 = new Player('Sally');

game.addPlayerToGame(player1);
game.addPlayerToGame(player2);

game.startGame();