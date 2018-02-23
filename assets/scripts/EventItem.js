const UIManager = require('UIManager');

cc.Class({
    extends: cc.Component,

    properties: {
        // these two methods are set on instantiation
        eventId: null,
        event: null,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        if (this.eventId == null) {
            throw new Error('undefined event!');
        }

        this.name = 'Event Item ' + this.eventId;
        if (this.event == undefined) {
            throw new Error(`undefined event, eventId=${this.eventId}`);
        }

        // set title
        this.node.getChildByName('Label').getComponent(cc.Label).string = this.event.title;

        // load the icon from the icon atlas
        cc.loader.loadRes(UIManager.instance.getResPath('textures/icons'), cc.SpriteAtlas, (err, atlas) => {
            let frame = atlas.getSpriteFrame(this.event.iconId);
            let sprite = this.node.getChildByName('Icon').getComponent(cc.Sprite);
            sprite.spriteFrame = frame;
        });
    },

    onEventSelected (event, customEventData) {
        UIManager.instance.pickEvent(this.eventId);
    }
    // update (dt) {},
});
