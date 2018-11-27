import uuid from 'uuid';

export class Card {
    protected _id: string;
    protected _type: Card.Type;
    protected _color?: Card.Color;
    protected _value?: number;

    constructor(type: Card.Type, color?: Card.Color, value?: number){
        this._id = uuid.v4();
        this._type = type;
        this._color = color;
        this._value = value;
    }

    static loadCard(id: string, type: Card.Type, color?: Card.Color, value?: number){
        let card = new Card(type, color, value);

        card._id = id;

        return card;
    }

    get id(): string {
        return this._id;
    }

    get type(): Card.Type {
        return this._type as Card.Type;
    }

    get color(): Card.Color | undefined {
        return this._color ? this._color : undefined;
    }

    set color(color: Card.Color | undefined) {
        this._color = color;
    }

    get value(): number | undefined {
        return (this._type === Card.Type.Numeric) ? this._value: undefined;
    }

    isValidAgainst(card: Card): boolean {
        return this.type === Card.Type.Wild || this.type === Card.Type.Wild_Draw || this.color === card.color || (this.type === card.type && this.type !== Card.Type.Numeric)
            || (this.type === Card.Type.Numeric && card.type === Card.Type.Numeric && this.value === card.value);
    }

    toString(): string {
        switch(this.type){
            case Card.Type.Numeric:
                return `[${ this.color } | ${ this.value }]`;
            case Card.Type.Wild:
            case Card.Type.Wild_Draw:
                return `[${ this.type }]`;
            default:
                return `[${ this.color } | ${ this.type }]`;
        }
    }
}

export namespace Card {
    export enum Color {
        Red     = 'red',
        Blue    = 'blue',
        Green   = 'green',
        Yellow  = 'yellow',
    }

    export enum Type {
        Numeric     = 'numeric',
        Skip        = 'skip',
        Draw        = 'draw',
        Reverse     = 'reverse',
        Wild        = 'wild',
        Wild_Draw   = 'wild-draw',
    }
}

export default Card;