const pf2eRulesBasedNpcVisionModuleName = "pf2e-rules-based-npc-vision";

/** Equivalent to the VisionLevel enum in the Pathfinder 2e system */
class VisionLevelPF2e {
    static BLINDED = 0;
    static NORMAL = 1;
    static LOW_LIGHT_VISION = 2;
    static DARKVISION = 3;
}

Hooks.on(
    "init",
    () => {
        // Calculate the NPCs vision level from its sense field. The field is a free-text string, so we have to do a bit of
        // maniplulation and make some assumptions about the data.
        libWrapper.register(
            pf2eRulesBasedNpcVisionModuleName,
            "CONFIG.PF2E.Actor.documentClasses.npc.prototype.visionLevel",
            function npcVisionLevel(...args) {
                const senses = this.data.data.traits.senses.value.split(",").map(s => s.replace(/[\s-]+/g, '').toLowerCase());
                return this.getCondition("blinded") ? VisionLevelPF2e.BLINDED
                    : senses.includes("darkvision")
                        ? VisionLevelPF2e.DARKVISION
                        : senses.includes("lowlightvision")
                            ? VisionLevelPF2e.LOW_LIGHT_VISION
                            : VisionLevelPF2e.NORMAL;
            },
            "OVERRIDE"
        );

        // The Pathfinder 2e system and Perfect Vision both ignore NPCs for vision settings. Since the Perfect Vision
        // code effectively overrides the base system code, we'll change how we override depending on the module's presence.
        if (game.modules.get("perfect-vision")?.active) {
            libWrapper.register(
                pf2eRulesBasedNpcVisionModuleName,
                "CONFIG.Token.documentClass.prototype.prepareDerivedData",
                function prepareNpcDerivedData(wrapped, ...args) {
                    wrapped(args);

                    if (!(this.initialized && this.actor && this.scene)) return;

                    if (this.scene.rulesBasedVision && this.actor.type === "npc") {
                        this.data.dimSight = this.data._source.dimSight = this.hasLowLightVision ? 10000 : 0;
                        this.data.brightSight = this.data._source.brightSight = this.hasDarkvision ? 10000 : 0;

                        const isBlinded = this.actor.visionLevel === 0;

                        setProperty(this.data, "flags.perfect-vision.sightLimit", isBlinded ? 0 : null);
                        setProperty(this.data._source, "flags.perfect-vision.sightLimit", isBlinded ? 0 : null);
                    }
                },
                "WRAPPER"
            );
        } else {
            libWrapper.register(
                pf2eRulesBasedNpcVisionModuleName,
                "CONFIG.Token.documentClass.prototype.prepareDerivedData",
                function prepareNpcDerivedData(wrapped, ...args) {
                    wrapped(args);

                    if (!(this.initialized && this.actor && this.scene)) return;

                    if (this.scene.rulesBasedVision && this.actor.type === "npc") {
                        const hasDarkvision = this.hasDarkvision && (this.scene.isDark || this.scene.isDimlyLit);
                        const hasLowLightVision = (this.hasLowLightVision || this.hasDarkvision) && this.scene.isDimlyLit;
                        this.data.brightSight = this.data._source.brightSight = hasDarkvision || hasLowLightVision ? 1000 : 0;
                    }
                },
                "WRAPPER"
            );
        }
    }
);
