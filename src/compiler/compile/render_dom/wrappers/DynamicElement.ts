import Wrapper from './shared/Wrapper';
import Renderer from '../Renderer';
import Block from '../Block';
import FragmentWrapper from './Fragment';
import { b, x } from 'code-red';
import { Identifier } from 'estree';
import DynamicElement from '../../nodes/DynamicElement';
import ElementWrapper from './Element/index';
import create_debugging_comment from './shared/create_debugging_comment';
import Element from '../../nodes/Element';

export default class DynamicElementWrapper extends Wrapper {
	fragment: FragmentWrapper;
	node: DynamicElement;
	elementWrapper: ElementWrapper;
	block: Block;
	dependencies: string[];
	var: Identifier = { type: 'Identifier', name: 'dynamic_element' };

	constructor(
		renderer: Renderer,
		block: Block,
		parent: Wrapper,
		node: DynamicElement,
		strip_whitespace: boolean,
		next_sibling: Wrapper
	) {
		super(renderer, block, parent, node);

		this.not_static_content();
		this.dependencies = node.tag.dynamic_dependencies();

		if (this.dependencies.length) {
			block = block.child({
				comment: create_debugging_comment(node, renderer.component),
				name: renderer.component.get_unique_name('dynamic_element_block'),
				type: 'dynamic_element'
			});
			renderer.blocks.push(block);
		}

		(node as unknown as Element).dynamic_tag = node.tag;

		this.block = block;
		this.elementWrapper = new ElementWrapper(
			renderer,
			this.block,
			parent,
			(node as unknown) as Element,
			strip_whitespace,
			next_sibling
		);
	}

	render(block: Block, parent_node: Identifier, parent_nodes: Identifier) {
		if (this.dependencies.length === 0) {
			this.render_static_tag(block, parent_node, parent_nodes);
		} else {
			this.render_dynamic_tag(block, parent_node, parent_nodes);
		}
	}

	render_static_tag(
		_block: Block,
		parent_node: Identifier,
		parent_nodes: Identifier
	) {
		this.elementWrapper.render(this.block, parent_node, parent_nodes);
	}

	render_dynamic_tag(
		block: Block,
		parent_node: Identifier,
		parent_nodes: Identifier
	) {
		this.elementWrapper.render(
			this.block,
			null,
			(x`#nodes` as unknown) as Identifier
		);

		const has_transitions = !!(
			this.block.has_intro_method || this.block.has_outro_method
		);
		const dynamic = this.block.has_update_method;

		const previous_tag = block.get_unique_name('previous_tag');
		const snippet = this.node.tag.manipulate(block);
		block.add_variable(previous_tag, snippet);

		const not_equal = this.renderer.component.component_options.immutable
			? x`@not_equal`
			: x`@safe_not_equal`;
		const condition = x`${this.renderer.dirty(
			this.dependencies
		)} && ${not_equal}(${previous_tag}, ${previous_tag} = ${snippet})`;

		block.chunks.init.push(b`
			let ${this.var} = ${this.block.name}(#ctx);
		`);

		block.chunks.create.push(b`${this.var}.c();`);

		if (this.renderer.options.hydratable) {
			block.chunks.claim.push(b`${this.var}.l(${parent_nodes});`);
		}

		block.chunks.mount.push(
			b`${this.var}.m(${parent_node || '#target'}, ${
				parent_node ? 'null' : '#anchor'
			});`
		);

		const anchor = this.get_or_create_anchor(block, parent_node, parent_nodes);
		const body = b`
			${
				has_transitions
					? b`
						@group_outros();
						@transition_out(${this.var}, 1, 1, @noop);
						@check_outros();
					`
					: b`${this.var}.d(1);`
			}
			${this.var} = ${this.block.name}(#ctx);
			${this.var}.c();
			${has_transitions && b`@transition_in(${this.var})`}
			${this.var}.m(${this.get_update_mount_node(anchor)}, ${anchor});
		`;

		if (dynamic) {
			block.chunks.update.push(b`
			if (${condition}) {
				${body}
			} else {
				${this.var}.p(#ctx, #dirty);
			}
		`);
		} else {
			block.chunks.update.push(b`
			if (${condition}) {
				${body}
			}
		`);
		}

		if (has_transitions) {
			block.chunks.intro.push(b`@transition_in(${this.var})`);
			block.chunks.outro.push(b`@transition_out(${this.var})`);
		}

		block.chunks.destroy.push(b`${this.var}.d(detaching)`);
	}
}
