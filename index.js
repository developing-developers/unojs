#!/usr/bin/env node
let commander = require('commander');
let faker = require('faker');

let Uno = require('./build/index');
let Card = Uno.Card;
let Game = Uno.Game;
let Player = Uno.Player;

let onGameStart = (game, players) => {
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
                    color = Uno.Core.CARD_COLORS[Math.floor(Math.random() * Uno.Core.CARD_COLORS.length)];
                    break;
            }

            game.playerPlaysACard(player, cardToPlay, color);
        }
    }
    console.log(game.eventStack);
    console.log(`Game lasted ${turn} turns.`)
};


commander
    .arguments(`<command> [id]`)
    .option('-p --players <players>', 'Number of Players.', 2)
    .action((command, id) => {
        if(command !== ""){
            switch(command){
                case "new":
                    let game = Uno.Game.newGame();
                    game.on(Game.Events.GameStarted, onGameStart);

                    for(let i = 0; i < commander.players; i++){
                        game.addPlayerToGame(new Player(faker.name.findName()));
                    }

                    game.startGame();
                    break;
                case "load":
                    break;
                default:
                    console.log('Invalid command %s', command);
                    break;
            }
        } else {
            console.log("No Command Specified.");
        }

    }).parse(process.argv);
