import Card from "./Card";
import {default as collect, Collection} from "collect.js";
import uuid = require("uuid");

export class Player {
    protected _id: string;
    protected _name: string;
    protected _hand: Collection<Card>;

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get hand(): Collection<Card> {
        return this._hand;
    }

    get cardsInHand(): number {
        return this._hand.count();
    }

    constructor(name: string){
        this._id = uuid.v4();
        this._name = name;
        this._hand = collect<Card>([]);
    }

    static LoadPlayer(id: string, name: string, hand?: Collection<Card>){
        let player = new Player(name);

        player._id = id;

        if(hand){
            player._hand = hand;
        }

        return player;
    }

    addCardToHand(card: Card): void {
        this._hand.push(card);
    }

    playCardFromHand(card: Card): void {
        this._hand = this._hand.reject((cardInHand: Card) => {
            return cardInHand.id === card.id;
        });
    }

    validCards(against: Card): Collection<Card> {
        return this._hand.filter((card: Card) => {
            return card.isValidAgainst(against);
        });
    }

    toString = (): string => this.name;
}

export namespace Player {

}
