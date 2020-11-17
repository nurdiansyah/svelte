/* test/sourcemaps/samples/script/input.svelte generated by Svelte vx.xx.x */
import {
	SvelteComponent,
	detach,
	element,
	init,
	insert,
	noop,
	safe_not_equal
} from "svelte/internal";

import { onMount } from "svelte";

function create_fragment(ctx) {
	let div;

	return {
		c() {
			div = element("div");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance($$self) {
	onMount(() => {
		console.log(42);
	});

	return [];
}

class Input extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

export default Input;
//# sourceMappingURL=output.js.map