export class LancerCombat extends Combat {
    /** @override */
    _prepareCombatant(c, scene, players, settings = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        c = super._prepareCombatant(c, scene, players, settings);
        // Get initiative settings
        var initiativeMax = game.settings.get(CONFIG.LancerInitiative.module, "max");
        var initiativeRefresh = game.settings.get(CONFIG.LancerInitiative.module, "refresh");
        // Populate activation data
        c.flags.activations = (_a = c.flags.activations) !== null && _a !== void 0 ? _a : {};
        c.flags.activations.max = (_e = (_b = c.flags.activations.max) !== null && _b !== void 0 ? _b : (_d = (_c = c.actor) === null || _c === void 0 ? void 0 : _c.data.data) === null || _d === void 0 ? void 0 : _d.activations) !== null && _e !== void 0 ? _e : initiativeMax;
        c.flags.activations.value = (_f = c.flags.activations.value) !== null && _f !== void 0 ? _f : 0;
        c.flags.dummy = (_g = c.flags.dummy) !== null && _g !== void 0 ? _g : false;
        c.flags.activations.refresh = (_h = c.flags.activations.refresh) !== null && _h !== void 0 ? _h : initiativeRefresh;
        // Set an arbitrary initiative so that attempting to roll doesn't raise an
        // exception for the dummy.
        if (c.flags.dummy) {
            c.initiative = -1;
            c.visible = false;
        }
        return c;
    }
    /** @override */
    _sortCombatants(a, b) {
        var _a, _b, _c, _d;
        if (a.flags.dummy)
            return -1;
        if (b.flags.dummy)
            return 1;
        // Sort by Players then Neutrals then Hostiles
        const dc = ((_b = (_a = b.token) === null || _a === void 0 ? void 0 : _a.disposition) !== null && _b !== void 0 ? _b : -2) - ((_d = (_c = a.token) === null || _c === void 0 ? void 0 : _c.disposition) !== null && _d !== void 0 ? _d : -2);
        if (dc !== 0)
            return dc;
        return super._sortCombatants(a, b);
    }
    /** @override */
    _onCreate(data, options, userId) {
        if (this.owner)
            this.createCombatant({
                "flags.dummy": true,
                hidden: true,
            });
        super._onCreate(data, options, userId);
    }
    /**
     * Set all combatants to their max activations
     * @public
     */
    async resetActivations() {
        let updates = this.combatants.map(c => {
            if (c.flags.activations.value + c.flags.activations.refresh < c.flags.activations.max) {
                var new_value = c.flags.activations.value + c.flags.activations.refresh;
            } else {
                var new_value = c.flags.activations.max;
            };
            return {
                _id: c._id,
                "flags.activations.value": c.defeated ? 0 : new_value,
                "flags.activations.max": c.flags.activations.max,
            };
        });
        await this.updateCombatant(updates);
    }
    /** @override */
    async startCombat() {
        await this.resetActivations();
        return super.startCombat();
    }
    /** @override */
    async nextRound() {
        await this.resetActivations();
        return super.nextRound();
    }
    /** @override */
    async previousRound() {
        await this.resetActivations();
        let turn = 0;
        const round = Math.max(this.round - 1, 0);
        let advanceTime = -1 * this.turn * CONFIG.time.turnTime;
        if (round > 0)
            advanceTime -= CONFIG.time.roundTime;
        return this.update({ round, turn }, { advanceTime });
    }
    /** @override */
    async resetAll() {
        await this.resetActivations();
        return super.resetAll();
    }
    /**
     * Sets the active turn to the combatant passed by id or calls
     * {@link LancerCombat#requestActivation()} if the user does not have
     * permission to modify the combat
     */
    async activateCombatant(id) {
        if (!game.user.isGM)
            return this.requestActivation(id);
        let c = this.getCombatant(id);
        let val = c.flags.activations.value;
        if (val === 0)
            return this;
        await this.updateCombatant({
            _id: id,
            "flags.activations.value": val - 1,
        });
        const turn = this.turns.findIndex((t) => t._id === id);
        return this.update({ turn });
    }
    /**
     * Calls any Hooks registered for "LancerCombatRequestActivate".
     * @private
     */
    async requestActivation(id) {
        Hooks.callAll("LancerCombatRequestActivate", this, id);
        return this;
    }
}
//# sourceMappingURL=lancer-combat.js.map