import {default as collect, Collection} from "collect.js";
import {Uno} from "./Uno";
import Card from "./Card";
import {Player} from "./Player";
import {EventEmitter} from "events";
import uuid from "uuid";

export interface IGameEvents {
    'game-started': (game: Game, players: Collection<Player>) => any;
    'game-ended': (winner: Player) => any;
    'player-joined-game': (player: Player, game: Game) => any;
    'player-drew-card': (player: Player, card: Card) => any;
    'player-played-card': (player: Player, card: Card) => any;
    'turn-advanced': (turn: number, player: Player) => any;
    'player-skipped': (player: Player, nextPlayer: Player) => any;
    'play-reversed': (nextPlayer: Player) => any;
    'color-was-set': (color: Card.Color) => any;
    string: (...args: any[]) => any;
}

export interface IGameEventEmitter<T>{
    on<K extends keyof T>(event: K, listener: T[K]): this;
}

export class GameEvent {
    event: Game.Events;
    args: any[];

    constructor(event: Game.Events, ...args: any[]) {
        this.event = event;
        this.args = args;
    }
}

export class Game implements IGameEventEmitter<IGameEvents> {
    protected _id: string;
    protected _players: Collection<Player>;
    protected _uno: Uno;
    protected _gameStarted: boolean = false;
    protected _winner: Player | null = null;
    protected _turnPosition: number = 0;
    protected _turnDirection: 1 | -1 = 1;
    protected _turnColor: Card.Color | null = null;
    protected _turnWillSkip: boolean = false;
    protected _playerDraws: number = 0;
    protected _eventEmitter: EventEmitter;
    protected _turn: number;
    protected _events: Collection<GameEvent>;

    constructor() {
        this._id = uuid.v4();
        this._eventEmitter = new EventEmitter();
        this._events = collect<GameEvent>([]);

        this._turn = 1;
        this._uno = Uno.newGame();
        this._players = collect<Player>([]);
    }

    on<K extends keyof IGameEvents>(event: K, listener: IGameEvents[K]): this {
        this._eventEmitter.on(event, listener);

        return this;
    }

    emit(event: Game.Events, ...args: any[]): this {
        this._events.push(new GameEvent(event, ...args));
        this._eventEmitter.emit(event, ...args);

        return this;
    }

    static newGame(): Game {
        return new Game;
    }

    static loadGameFromEvents(id: string, events: Collection<GameEvent>): Game {
        let game = new Game;

        game._id = id;

        return game;
    }

    get eventStack(): string {
        let output: string = "";

        for(let event of this._events.all()){
            output += `${event.event}\n`;
        }

        return output;
    }

    get eventCount(): number {
        return this._events.count();
    }

    get id(): string {
        return this._id;
    }

    get playerCount(): number {
        return this._players.count();
    }

    get gameHasStarted(): boolean {
        return this._gameStarted;
    }

    get gameHasEnded(): boolean {
        return this._winner !== null;
    }

    get winner(): Player | null {
        return this._winner;
    }

    get turn(): number {
        return this._turn;
    }

    get currentPlayer(): Player {
        return this._players.get(this._turnPosition) as Player;
    }

    get nextPlayer(): Player {
        let pos = this._turnPosition + this._turnDirection;
        if (pos > this.playerCount - 1) {
            pos = 0;
        } else if (pos < 0) {
            pos = this.playerCount - 1;
        }

        return this._players.get(pos) as Player;
    }

    get cardsInDeck(): number {
        return this._uno.cardsInDeck;
    }

    get cardsInDiscard(): number {
        return this._uno.cardsInDiscard;
    }

    get currentCard(): Card {
        let card = this._uno.discard.pop();
        this._uno.discard.push(card);

        return card;
    }

    playerDrawsACard(player: Player, endsTurn: boolean = false): Card {
        let card = this._uno.drawCard();
        player.addCardToHand(card);

        if (endsTurn) {
            this.advanceTurn();
        }

        this.emit(Game.Events.PlayerDrewCard, player, card);

        return card;
    }

    playerPlaysACard(player: Player, card: Card, newColor?: Card.Color): void {
        player.playCardFromHand(card);

        this.emit(Game.Events.PlayerPlayedCard, player, card);

        switch (card.type) {
            case Card.Type.Reverse:
                if (this.playerCount === 2) {
                    this.skipNextPlayer();

                } else {
                    this.reverseDirection();
                }
                break;
            case Card.Type.Skip:
                this.skipNextPlayer();
                break;
            case Card.Type.Draw:
                this.nextPlayerDrawsCards(2);
                break;
            case Card.Type.Wild:
            case Card.Type.Wild_Draw:
                card.color = newColor;
                this.emit(Game.Events.ColorWasSet, newColor);
                if(card.type === Card.Type.Wild_Draw){
                    this.nextPlayerDrawsCards(4);
                }
                break;
        }

        this._uno.discardCard(card);

        if (player.cardsInHand === 0) {
            this._winner = player;
            this.emit(Game.Events.GameEnded, this.winner);

            return;
        }

        this.advanceTurn();
    }

    private advanceTurn(): void {
        this._turn++;
        this._turnPosition += this._turnDirection;

        if (this._turnPosition > this.playerCount - 1) {
            this._turnPosition = 0;
        } else if (this._turnPosition < 0) {
            this._turnPosition = this.playerCount - 1;
        }

        if (this._playerDraws) {
            for (let i = 0; i < this._playerDraws; i++) {
                this.playerDrawsACard(this.currentPlayer);
            }
            this._playerDraws = 0;
        }

        if (this._turnWillSkip) {
            this._turnWillSkip = false;
            this.emit(Game.Events.PlayerSkipped, this.currentPlayer);
            this.advanceTurn();
        }
    }

    addPlayerToGame(player: Player): boolean {
        if (this.playerCount < Uno.MAX_PLAYER_COUNT) {
            this._players.push(player);

            this.emit(Game.Events.PlayerJoinedGame, player);

            return true;
        }

        return false;
    }

    startGame(): boolean {
        if (this.playerCount >= Uno.MIN_PLAYER_COUNT
            && this.playerCount <= Uno.MAX_PLAYER_COUNT) {
            this.determineDealer();
            this.shuffleDeck();
            this.dealStartingHand();
            this.flipTopCardForStart();
            this._gameStarted = true;

            this.emit(Game.Events.GameStarted, this, this._players, this._uno.deck, this._uno.discard);

            return true;
        }

        return false;
    }

    private shuffleDeck() {
        this._uno.shuffleDeck();

        this.emit(Game.Events.DeckWasShuffled, this._uno.deck);
    }

    private flipTopCardForStart(): void {
        let startCard = this._uno.drawCard();

        switch (startCard.type) {
            case Card.Type.Reverse:
                if (this.playerCount === 2) {
                    this.skipNextPlayer();
                } else {
                    this.reverseDirection();
                }
                break;
            case Card.Type.Skip:
                this.advanceTurn();
                this.advanceTurn();
                break;
            case Card.Type.Draw:
                this.nextPlayerDrawsCards(2);
                this.skipNextPlayer();
                break;
            case Card.Type.Wild:
                break;
            case Card.Type.Wild_Draw:
                this._uno.returnCard(startCard);
                this._uno.shuffleDeck();
                this.flipTopCardForStart();
                return;
        }

        if (startCard.type !== Card.Type.Wild) {
            this._turnColor = startCard.color as Card.Color;
        }

        this._uno.discardCard(startCard);
    }

    private nextPlayerDrawsCards(quantity: number): void {
        this._playerDraws = quantity;
    }

    private reverseDirection(): void {
        this._turnDirection *= -1;

        this.emit(Game.Events.PlayReversed, [this.nextPlayer]);
    }

    private skipNextPlayer(): void {
        this._turnWillSkip = true;
    }

    private dealStartingHand(): void {
        this._players.each((player: Player) => {
            for (let i = 0; i < Uno.STARTING_HAND; i++) {
                let card = this._uno.drawCard();
                player.addCardToHand(card);
            }

            this.emit(Game.Events.PlayerDrewStartHand, player.hand);
        })
    }

    private determineDealer(): void {
        this._turnPosition = Math.floor(Math.random() * this.playerCount);
    }
}

export namespace Game {
    export enum Events {
        GameStarted         = 'game-started',
        GameEnded           = 'game-ended',
        PlayerJoinedGame    = 'player-joined-game',
        PlayerDrewCard      = 'player-drew-card',
        PlayerDrewStartHand = 'player-drew-start-hand',
        PlayerPlayedCard    = 'player-played-card',
        PlayerWonTheGame    = 'player-won-the-game',
        TurnAdvanced        = 'turn-advanced',
        PlayerSkipped       = 'player-skipped',
        PlayReversed        = 'play-reversed',
        ColorWasSet         = 'color-was-set',
        DeckWasShuffled     = 'deck-was-shuffled',
    }
}