import Fiber, { EffectTags } from './fiber'
import { createDom, createElement, createTextElement, updateDom } from './dom'

let wipFiber;
let hookIndex;
let wipRoot;
let currentRoot;
let nextUnitOfWork;
let deletions;

const reconcileChildren = (parentFiber, children) => {
  let index = 0
  let oldChildFiber =
    parentFiber.alternate && parentFiber.alternate.child
  let prevSibling = null

  while (index < children.length || oldChildFiber != null) {
    const childFiber = children[index]
    let newFiber = null;

    const sameType =
      oldChildFiber &&
      childFiber &&
      childFiber.type === oldChildFiber.type

    if (sameType) {
      newFiber = new Fiber({
        type: oldChildFiber.type,
        props: childFiber.props,
        dom: oldChildFiber.dom,
        parent: parentFiber,
        alternate: oldChildFiber,
        effectTag: EffectTags.UPDATE
      })
    }
    if (childFiber && !sameType) {
      newFiber = new Fiber({
        type: childFiber.type,
        props: childFiber.props,
        dom: null,
        parent: parentFiber,
        alternate: null,
        effectTag: EffectTags.PLACEMENT,
      });
    }
    if (oldChildFiber && !sameType) {
      oldChildFiber.effectTag = EffectTags.DELETION
      deletions.push(oldChildFiber)
    }

    if (oldChildFiber) {
      oldChildFiber = oldChildFiber.sibling;
    }

    if (index === 0) {
      parentFiber.child = newFiber
    } else if (childFiber) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber
    index++
  }
}

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

const useState = (initialState) => {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action(hook.state);
  });

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

const performUnitOfWork = (fiber) => {
  const isFunctionComponent =
    fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

const workLoop = (deadline) => {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

const commitRoot = () => {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

const commitDeletion = (fiber, domParent) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

const commitWork = (fiber) => {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;
  if (fiber.effectTag === EffectTags.PLACEMENT
    && fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === EffectTags.UPDATE
    && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === EffectTags.DELETION
    && fiber.dom != null) {
    commitDeletion(fiber, domParent)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const render = (element, container) => {
  wipRoot = new Fiber({
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot
  })

  deletions = [];
  nextUnitOfWork = wipRoot;
  requestIdleCallback(workLoop)
}

export default {
  createElement,
  createTextElement,
  render,
  useState
}
