export default class ScriptGenerator {
    async generate(intent) {
        const scripts = {
            CREATE: 'app.project.activeItem.layers.addShape();',
            MOVE: 'layer.transform.position.setValue([100, 100]);',
            SCALE: 'layer.transform.scale.setValue([150, 150]);',
            ANIMATE: 'layer.transform.position.expression = "wiggle(5, 30)";'
        };
        return scripts[intent.type] || '// Unknown command';
    }
}
