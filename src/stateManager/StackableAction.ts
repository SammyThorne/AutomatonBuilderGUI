/**
 * Pushes an action to the action stack that sets the accept status of the
 * given nodes.
 * @param nodes The nodes to set the accept status of.
 * @param isAccept Whether or not the given nodes should be an accepting node.
 */
import NodeWrapper from "../NodeWrapper";
import UndoRedoManager, { Action, ActionData } from "../UndoRedoManager";
import StateManager from "./StateManager";
import { Vector2d } from "konva/lib/types";
import CommentRegion from "../CommentRegion";

/** Holds the data associated with a "set nodes is accept node" action. */
export class SetNodesIsAcceptActionData extends ActionData {
  /** Whether or not the old nodes were an accept node before this action. */
  public oldValues: boolean[];

  /** Whether or not the nodes were an accept node after this action. */
  public newValue: boolean;

  /** The nodes to set the accept status of in this action. */
  public nodes: NodeWrapper[];
}

/** Holds the data associated with a "move nodes" action. */
class MoveStatesActionData extends ActionData {
  /** The amount by which nodes were moved in this action. */
  public delta: Vector2d;

  /** The nodes moved in this action. */
  public states: Array<NodeWrapper>;
}

export class StackableAction {
  /** The initial position of one of the nodes when nodes are dragged. */
  static _dragStatesStartPosition: Vector2d | null = null;

  /**
   * Updates the position of the start node arrow to align with the
   * automaton's start node.
   */
  public static updateStartNodePosition() {
    StateManager._startStateLine.absolutePosition(
      StateManager._startNode.nodeGroup.absolutePosition(),
    );
  }

  public static setNodesIsAccept(nodes: NodeWrapper[], isAccept: boolean) {
    if (StateManager.isDebugEnabled()) return;
    const oldValues = nodes.map((node) => node.isAcceptNode);

    const setNodesIsAcceptForward = (data: SetNodesIsAcceptActionData) => {
      data.nodes.forEach((node) => {
        node.isAcceptNode = data.newValue;
      });
    };

    const setNodesIsAcceptBackward = (data: SetNodesIsAcceptActionData) => {
      data.nodes.forEach((node, i) => {
        node.isAcceptNode = data.oldValues[i];
      });
    };

    let actionStackLabel;

    if (nodes.length == 1) {
      actionStackLabel = `Mark "${nodes[0].labelText}" As ${isAccept ? "Accepting" : "Rejecting"}`;
    } else {
      actionStackLabel = `Mark ${nodes.length} Selected States As ${isAccept ? "Accepting" : "Rejecting"}`;
    }

    const setNodesIsAcceptAction = new Action(
      "setNodesIsAccept",
      actionStackLabel,
      setNodesIsAcceptForward,
      setNodesIsAcceptBackward,
      { oldValues: oldValues, newValue: isAccept, nodes: nodes },
    );
    UndoRedoManager.pushAction(setNodesIsAcceptAction);
  }

  /**
   * Pushes an action to the action stack that moves the selected nodes
   * by a certain amount.
   * @param finalPos The final position of the same node as was used for
   * `StateManager.startDragStatesOperation` at the beginning of this drag
   * operation.
   */
  public static completeDragStatesOperation(finalPos: Vector2d) {
    const startPos = this._dragStatesStartPosition;
    const endPos = finalPos;
    const delta: Vector2d = {
      x: endPos.x - startPos.x,
      y: endPos.y - startPos.y,
    };

    const moveStatesForward = (data: MoveStatesActionData) => {
      data.states.forEach((state) => {
        state.setPosition({
          x: state.nodeGroup.position().x + delta.x,
          y: state.nodeGroup.position().y + delta.y,
        });

        if (StateManager.startNode === state) {
          this.updateStartNodePosition();
        }
      });
      StateManager.updateTransitions();
    };

    let moveStatesBackward = (data: MoveStatesActionData) => {
      data.states.forEach((state) => {
        state.setPosition({
          x: state.nodeGroup.position().x - delta.x,
          y: state.nodeGroup.position().y - delta.y,
        });

        if (StateManager.startNode === state) {
          this.updateStartNodePosition();
        }
      });
      StateManager.updateTransitions();
    };

    let moveStatesString = "Move ";
    if (StateManager.selectedObjects.length > 1) {
      moveStatesString += `${StateManager.selectedObjects.length} Nodes`;
    } else if (StateManager.selectedObjects.length == 1) {
      const singleState = StateManager.selectedObjects[0] as NodeWrapper;
      moveStatesString += `"${singleState.labelText}"`;
    }

    const moveNodesAction = new Action(
      "moveStates",
      moveStatesString,
      moveStatesForward,
      moveStatesBackward,
      { delta: delta, states: [...StateManager.selectedObjects] },
    );

    UndoRedoManager.pushAction(moveNodesAction, false);
  }
}

/** Holds the data associated with a "resize comment" action. */
export class ResizeCommentActionData extends ActionData {
  /** The old size before the action was taken */
  public oldSize: Vector2d;

  /** The old position before the action was taken */
  public oldPos: Vector2d;

  /** The comment being resized in this action. */
  public comment: CommentRegion;
}

/** Holds the data associated with a "set comments text" action. */
export class SetCommentsTextActionData extends ActionData {
  /** The old texts before the action was taken */
  public oldTexts: string[];

  /** The old text after the action was taken */
  public newText: string;

  public comments: CommentRegion[];
}
