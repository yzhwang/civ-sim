
// provide basic support for game data and all script namings
class GameDataManager {
    constructor(gameData) {
        this.gameData = gameData;
        this.curAgeId = undefined;
        this.curEventId = undefined;
    }

    /////////////////////////////////////////////
    // Public Functions 
    /////////////////////////////////////////////
    get ageBeginFunc() {
        return [this.curAgeId, 'begin'].join('.');
    }

    get eventRunFunc() {
        return [this.curAgeId, this.curEventId, 'run'].join('.');
    }

    get ageGrandFilterCheckFunc() {
        return [this.curAgeId, 'grandFilterCheck'].join('.');
    }

    get curAge() {
        return this.gameData.ages[this.curAgeId];
    }

    get curEvent() {
        return this.gameData.ages[this.curAgeId].events[this.curEventId];
    }

    getEvent(eventId) {
        return this.gameData.ages[this.curAgeId].events[eventId];
    }

    /////////////////////////////////////////////
    // Private Functions 
    /////////////////////////////////////////////
}

module.exports = GameDataManager;