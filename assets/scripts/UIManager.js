const BaguetteVM = require('baguette-vm').BaguetteVM;
const GameDataManager = require('GameDataManager');

const GameStates = {
    AGE_BEGINS: 1,
    RUN_EVENT: 2,
    GRAND_FILTER_CHECK: 3,
    GAME_OVER: 4
};

var gameStats = {
    curAgeTurn: 0,
    b: 2,
    c: 3,
};

var gameFuncs = {
    showText: {
        pauseAfterComplete: true,
        funcImp: {},
    },
    select: {
        pauseAfterComplete: true,
        funcImp: {},
    },
    newAge: {
        pauseAfterComplete: false,
        funcImp: {},
    },
    setBackground: {
        pauseAfterComplete: false,
        funcImp: {},
    },
    gameOver: {
        pauseAfterComplete: false,
        funcImp: {},
    },
};


class ResourceLoader {
    constructor () {
        this.bicLoadingComplete = false;
        this.gameDataLoadingComplete = false;

        cc.loader.loadRes(UIManager.instance.getResPath('gamescript'), (err, bicData) => {
            if (err) {
                throw new Error(`loading resource err: ${err}!`);
            }
            this.bicLoadingComplete = true;
            this.bicData = bicData;
            this.onResLoadingComplete();
        });

        cc.loader.loadRes(UIManager.instance.getResPath('gamedata'), (err, gameData) => {
            if (err) {
                throw new Error(`loading resource err: ${err}!`);
            }
            this.gameDataLoadingComplete = true;
            this.gameData = gameData;
            this.onResLoadingComplete();
        });
    }

    onResLoadingComplete () {
        if (this.bicLoadingComplete && this.gameDataLoadingComplete) {
            UIManager.instance.resLoadingComplete();
        }
    }
}

var UIManager = cc.Class({
    extends: cc.Component,
    statics: {
        instance: null,
    },
    properties: {
        gameDataManager: {
            default: null,
            visible: false,
        },
        baguetteVM: {
            default: null,
            visible: false,
        },
        resLoader: {
            default: null,
            visible: false,
        },
        gameState: {
            default: null,
            visible: false,
        },
        curAgeId: {
            default: null,
            visible: false,
        },
        nextAgeId: {
            default: null,
            visible: false,
        },
        // Event Panel Nodes
        eventPanel: {
            default: null,
            type: cc.Node
        },
        heading: {
            default: null,
            type: cc.Node
        },
        background: {
            default: null,
            type: cc.Node
        },
        touchArea: {
            default: null,
            type: cc.Node
        },
        buttonPanel: {
            default: null,
            type: cc.Node
        },
        // Event Picker Panel Nodes
        eventPickerPanel: {
            default: null,
            type: cc.Node
        },
        eventPickerContent: {
            default: null,
            type: cc.Node
        },
        eventItemPrefab: {
            default: null,
            type: cc.Prefab
        },
        mainText: {
            default: null,
            type: cc.Label
        },
        leftText: {
            default: null,
            type: cc.Label
        },
        rightText: {
            default: null,
            type: cc.Label
        },
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
    },

    /////////////////////////////////////////////
    // Public Functions 
    /////////////////////////////////////////////
    getResPath (path) {
        const ModName = 'civ-sim';
        return 'mods/' + ModName + '/' + path;
    },

    pickEvent(eventId) {
        this.gameDataManager.curEventId = eventId;
        this.runScript(this.gameDataManager.eventRunFunc);
    },

    /////////////////////////////////////////////
    // Init Functions
    /////////////////////////////////////////////
    initEventPickerPanel () {
        for (let i = 0; i < this.eventPickerContent.children.length; i++) {
            this.eventPickerContent.children[i].destroy();
        }

        let events = this.gameDataManager.curAge.events;
        if (events.length == 0) {
            throw new Error('No event to select!');
        }

        let eventIds = Object.keys(events);
        for (let i = 0; i < eventIds.length; i++) {
            let eventId = eventIds[i];
            let event = events[eventId];
            if (event.active) {
                this.addEvent(eventId, event);
            }
        }

        // At last, show the picker panel
        this.eventPickerPanel.active = true;
    },

    resLoadingComplete () {
        this.baguetteVM = new BaguetteVM(this.resLoader.bicData, gameStats, gameFuncs);
        this.gameDataManager = new GameDataManager(this.resLoader.gameData);
        this.startNewAge(this.gameDataManager.gameData.initialAgeId);
    },

    /////////////////////////////////////////////
    // Baguette Script Functions
    /////////////////////////////////////////////
    runScript(funcName) {
        this.eventPickerPanel.active = false;
        this.eventPanel.active = true;
        this.baguetteVM.runFunc(funcName);
        if (this.baguetteVM.state == BaguetteVM.State.Complete) {
            this.endScript();
        }
    },

    continueScript (returnValue) {
        if (!this.buttonPanel.active) {
            this.baguetteVM.continue(returnValue);
            if (this.baguetteVM.state == BaguetteVM.State.Complete) {
                this.endScript();
            }
        }
    },

    endScript() {
        this.eventPanel.active = false;

        if (this.gameState == GameStates.AGE_BEGINS) {
            this.gameState = GameStates.RUN_EVENT;
            this.initEventPickerPanel();
        } else if (this.gameState == GameStates.RUN_EVENT) {
            this.gameState = GameStates.GRAND_FILTER_CHECK;
            this.runScript(this.gameDataManager.ageGrandFilterCheckFunc);
        } else if (this.gameState == GameStates.GRAND_FILTER_CHECK) {
            if (this.nextAgeId == undefined) {
                this.gameState = GameStates.RUN_EVENT;
                this.startNewTurn();
                this.eventPickerPanel.active = true;
            } else {
                this.startNewAge(this.nextAgeId);
            }
        } else if (this.gameState == GameStates.GAME_OVER) {
            this.touchArea.active = false;
        } else {
            throw new Error('Unknown Game State!');
        }
    },

    /////////////////////////////////////////////
    // Age and Turn Functions
    /////////////////////////////////////////////
    startNewAge (ageId) {
        gameStats.curAgeTurn = -1;
        this.nextAgeId = undefined;
        this.gameDataManager.curAgeId = ageId;
        this.gameState = GameStates.AGE_BEGINS;
        this.startNewTurn();
        this.runScript(this.gameDataManager.ageBeginFunc);
    },

    startNewTurn () {
        gameStats.curAgeTurn += 1;
        let curTurn = this.gameDataManager.curAge.timestamps[gameStats.curAgeTurn];
        this.heading.getComponent(cc.Label).string = this.gameDataManager.curAge.title 
                                                     + ' - ' + curTurn;
    },

    /////////////////////////////////////////////
    // Virtual Machine Used Functions 
    /////////////////////////////////////////////
    addEvent (eventId, event) {
       let eventItem = cc.instantiate(this.eventItemPrefab);
       eventItem.getComponent('EventItem').eventId = eventId;
       eventItem.getComponent('EventItem').event = event;
       this.eventPickerContent.addChild(eventItem);
    },

    removeEvent (eventId) {
        let eventItem = this.eventPickerContent.getChildByName('Event Item ' + eventId);
        if (eventId == undefined) {
            throw new Error(`Cannot find event ${eventId}!`);
        }

        eventItem.destroy();
    },

    showText (text) {
        this.mainText.string = text;
    },

    select (leftText, rightText) {
        this.buttonPanel.active = true;

        this.leftText.string = leftText;
        this.rightText.string = rightText;
    },

    newAge (nextAgeId) {
        this.nextAgeId = nextAgeId;
        this.gameState = GameState.AGE_BEGINS;
    },

    setBackground(backgroundName) {
        if (backgroundName == '') {
            this.background.spriteFrame = null;
        } else {
            cc.loader.loadRes(UIManager.instance.getResPath('textures/backgrounds/'+backgroundName), 
                            cc.SpriteFrame, (err, backgroundSpriteFrame) => {
                if (err) {
                    throw new Error(`loading background err: ${err}!`);
                }

                this.background.getComponent(cc.Sprite).spriteFrame = backgroundSpriteFrame;
            });
        }
    },

    gameOver() {
        this.gameState = GameStates.GAME_OVER;
    },

    /////////////////////////////////////////////
    //  Cocos Callbacks and UI Events
    /////////////////////////////////////////////
    onLoad () {
        UIManager.instance = this;

        // bind 'this' pointer of the two funcs to current object
        gameFuncs.showText.funcImp = this.showText.bind(this);
        gameFuncs.select.funcImp = this.select.bind(this);
        gameFuncs.newAge.funcImp = this.newAge.bind(this);
        gameFuncs.setBackground.funcImp = this.setBackground.bind(this);
        gameFuncs.gameOver.funcImp = this.gameOver.bind(this);

        // let background listen to touch event
        this.touchArea.on('touchstart', this.continueScript.bind(this));

        // start loading resources
        this.resLoader = new ResourceLoader();
    },

    onSelectButtonPressed (event, customEventData) {
        this.buttonPanel.active = false;
        this.continueScript(customEventData);
    },

    // update (dt) {},
});
