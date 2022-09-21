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
            "pf2e-rules-based-npc-vision",
            "CONFIG.PF2E.Actor.documentClasses.npc.prototype.visionLevel",
            function npcVisionLevel() {
                const senses = (this.system.traits.senses.value ?? "").split(",").map(s => s.replace(/[\s-]+/g, '').toLowerCase());
                return this.getCondition("blinded") ? VisionLevelPF2e.BLINDED
                    : senses.some(sense => ["darkvision", "greaterdarkvision"].includes(sense))
                        ? VisionLevelPF2e.DARKVISION
                        : senses.includes("lowlightvision")
                            ? VisionLevelPF2e.LOW_LIGHT_VISION
                            : VisionLevelPF2e.NORMAL;
            },
            "OVERRIDE"
        );

        libWrapper.register(
            "pf2e-rules-based-npc-vision",
            "CONFIG.Token.documentClass.prototype.rulesBasedVision",
            function npcRulesBasedVision() {
                return !!(this.sight.enabled && this.actor?.isOfType("character", "familiar", "npc") && this.scene?.rulesBasedVision);
            },
            "OVERRIDE"
        );
    }
);
