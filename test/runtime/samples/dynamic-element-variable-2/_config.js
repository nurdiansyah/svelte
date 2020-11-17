export default {
	props: {
		tag: 'div',
		text: 'Foo'
	},
	html: '<div>Foo</div>',

	test({ assert, component, target }) {
		const div = target.firstChild;
		component.text = 'Bar';

		assert.htmlEqual(
			target.innerHTML,
			`
			<div>Bar</div>
		`
		);

		// Re-use element since tag has not changed
		assert.equal(div, target.firstChild);
	}
};
