export const EffectTags = {
  UPDATE: 'UPDATE',
  PLACEMENT: 'PLACEMENT',
  DELETION: 'DELETE'
}

class Fiber {
  constructor({ type, props, parent, dom, child, sibling, alternate, effectTag }) {
    this.type = type;
    this.props = props;
    this.parent = parent;
    this.dom = dom;
    this.child = child;
    this.sibling = sibling;
    this.alternate = alternate;
    this.effectTag = effectTag;
  }
}

export default Fiber;
