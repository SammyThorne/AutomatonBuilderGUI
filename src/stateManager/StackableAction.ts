/**
 * Pushes an action to the action stack that sets the accept status of the
 * given nodes.
 * @param nodes The nodes to set the accept status of.
 * @param isAccept Whether or not the given nodes should be an accepting node.
 */
import NodeWrapper from "../NodeWrapper";
import UndoRedoManager, { Action, ActionData } from "../UndoRedoManager";
import StateManager from "./StateManager";

/** Holds the data associated with a "set nodes is accept node" action. */
class SetNodesIsAcceptActionData extends ActionData {
  /** Whether or not the old nodes were an accept node before this action. */
  public oldValues: boolean[];

  /** Whether or not the nodes were an accept node after this action. */
  public newValue: boolean;

  /** The nodes to set the accept status of in this action. */
  public nodes: NodeWrapper[];
}

export default class StackableAction {
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
}
