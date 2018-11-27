import {Card} from './Card';
import {default as collect, Collection} from 'collect.js';

export class Uno {
    protected _deck: Collection<Card>;
    protected _discard: Collection<Card>;

    constructor() {
        this._deck = collect<Card>([]);
        this._discard = collect<Card>([]);
    }

    static loadUno(deck: Collection<Card>, discard: Collection<Card>) {
        let uno = new Uno;

        uno._deck = deck;
        uno._discard = discard;

        return uno;
    }

    get deck(): Collection<Card> {
        return this._deck;
    };

    get discard(): Collection<Card> {
        return this._discard;
    };

    get cardsInDeck(): number {
        return this._deck.count();
    }

    get cardsInDiscard(): number {
        return this._discard.count();
    }

    static newGame(): Uno {
        let uno = new Uno;

        uno.setupDeck();
        uno.shuffleDeck();

        return uno;
    }

    setupDeck(): void {
        for (let color of Uno.CARD_COLORS) {
            for (let i = 0; i <= 9; i++) {
                // Create 0-9 Numeric Cards
                this.addCard((i === 0) ? 1 : 2, Card.Type.Numeric, color as Card.Color, i);
            }

            // Create Skip Cards
            this.addCard(2, Card.Type.Skip, color as Card.Color);

            // Create Draw-Two Cards
            this.addCard(2, Card.Type.Draw, color as Card.Color);

            // Create Reverse Cards
            this.addCard(2, Card.Type.Reverse, color as Card.Color);
        }

        // Create Wild Cards
        this.addCard(4, Card.Type.Wild);

        // Create Wild Draw-Four Cards
        this.addCard(4, Card.Type.Wild_Draw);
    }

    shuffleDeck(): void {
        this._deck = this._deck.shuffle();
    }

    drawCard(): Card {
        if (this._deck.count() < 1) {
            this.shuffleDiscardIntoDeck();
        }

        return this._deck.pop();
    }

    returnCard(card: Card): void {
        this._deck.push(card);
    }

    discardCard(card: Card): void {
        this._discard.push(card);
    }

    shuffleDiscardIntoDeck(): void {
        let cardInPlay = this._discard.pop();
        let deck = this._deck;

        this._deck = this._discard;

        for (let card of deck.all()) {
            this._deck.push(card);
        }

        this.shuffleDeck();
        this.shuffleDeck();

        console.log(`Shuffling... ${this.cardsInDeck} cards in Deck.`);

        this._discard = collect<Card>([cardInPlay]);
    }

    protected addCard(count: number, type: Card.Type, color?: Card.Color, value?: number) {
        for (let i = 0; i < count; i++) {
            // Add Card (count) times to the deck
            let card = new Card(type, color, value);
            this._deck.push(card);
        }
    }
}

export namespace Uno {
    export const DECK_CARD_COUNT = 108;
    export const STARTING_HAND = 7;
    export const MIN_PLAYER_COUNT = 2;
    export const MAX_PLAYER_COUNT = 10;

    export const CARD_COLORS = [
        Card.Color.Red,
        Card.Color.Blue,
        Card.Color.Green,
        Card.Color.Yellow
    ];
}