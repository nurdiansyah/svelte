export default {
	props: {
		tag: 'div',
		text: 'Foo'
	},
	html: '<div>Foo</div>',

	test({ assert, component, target }) {
		const div = target.firstChild;
		component.tag = 'h1';
		component.text = 'Bar';

		assert.htmlEqual(target.innerHTML, `
			<h1>Bar</h1>
		`);

		const h1 = target.firstChild;
		assert.notEqual(div, h1);
	}
};
