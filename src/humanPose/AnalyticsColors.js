import * as THREE from '../../thirdPartyCode/three/three.module.js';

/**
 * A collection of colors used often in the analytics system.
 * They are created here to ensure that they are only created once.
 */
export const AnalyticsColors = {
    undefined: new THREE.Color(1, 0, 1),
    base: new THREE.Color(0, 0.5, 1),
    red: new THREE.Color(1, 0, 0),
    yellow: new THREE.Color(1, 1, 0),
    green: new THREE.Color(0, 1, 0),
    blue: new THREE.Color(0, 0, 1),
    /**
     * Fades a color to a faded version of itself.
     * @param {Color} color The color to fade.
     * @return {Color} The faded color.
     */
    fade: (color) => {
        const h = color.getHSL({}).h;
        return new THREE.Color().setHSL(h, 0.8, 0.3);
    }
};