import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { EditText } from "react-edit-text";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

import "./ItemList.scss";

type Item = {
  value: string;
  checked: boolean;
  id: string;
};

function ItemList() {
  let { id } = useParams();

  const [items, setItems] = useState<Item[]>([]);
  const [adding, setAdding] = useState<string>("");

  const { sendJsonMessage, readyState } = useWebSocket(
    `${process.env.REACT_APP_WS_URL}/${id}/ws`,
    {
      shouldReconnect: (closeEvent: CloseEvent) => {
        return closeEvent.code !== 1000;
      },
      reconnectAttempts: 10,
      reconnectInterval: 3000,
      share: true,
      onMessage: (unparsedMessage: MessageEvent) => {
        const msg = JSON.parse(unparsedMessage.data);
        if (msg instanceof Array) {
          setItems(msg);
        } else {
          if (msg.type === "add") {
            setItems([...items, msg.data]);
          } else if (msg.type === "remove") {
            setItems(items.filter((item) => item.id !== msg.data.id));
          } else if (msg.type === "update") {
            setItems(
              items.map((item) =>
                item.id === msg.data.id ? { ...item, ...msg.data } : item
              )
            );
          } else if (msg.type === "set") {
            console.log("set", msg.data);
            setItems(msg.data);
          } else if (msg.type === "order") {
            console.log("order", msg.data);
            const oldIdx = items.findIndex((item) => item.id === msg.data.id);
            if (oldIdx !== msg.data.oldIdx) {
              console.log("desync", msg.data.id, oldIdx, items);
              return;
            }
            const newItems = [...items];
            const [removed] = newItems.splice(msg.data.oldIdx, 1);
            newItems.splice(msg.data.newIdx, 0, removed);
            setItems(newItems);
          } else {
            console.error("Unknown message type:", msg.type, msg);
          }
        }
      },
    }
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const readyColour = {
    [ReadyState.CONNECTING]: "#f9b785",
    [ReadyState.OPEN]: "#c7faa2",
    [ReadyState.CLOSING]: "#f9b785",
    [ReadyState.CLOSED]: "#ff6961",
    [ReadyState.UNINSTANTIATED]: "#000000",
  }[readyState];

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/${id}`)
      .then((res) => res.json())
      .then((data) => setItems(data));
  }, [id]);

  function onCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, checked } = e.target;

    sendJsonMessage({
      type: "update",
      data: {
        id: id.slice(2, id.length),
        checked: checked,
      },
    });
  }

  function onRemoveclick(e: React.MouseEvent<HTMLButtonElement>) {
    const { id } = e.currentTarget;
    sendJsonMessage({
      type: "remove",
      id: id.slice(3, id.length),
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("submitting", adding);
    if (!adding) {
      return;
    }
    sendJsonMessage({
      type: "add",
      value: adding,
    });
    setAdding("");
  }

  function onDragEnd(e: DropResult) {
    if (!e.destination) {
      return;
    }
    const newItems = [...items];
    const [removed] = newItems.splice(e.source.index, 1);
    newItems.splice(e.destination.index, 0, removed);
    setItems(newItems);
    sendJsonMessage({
      type: "order",
      data: {
        id: removed.id,
        oldIdx: e.source.index,
        newIdx: e.destination.index,
      },
    });
  }

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <nav className="px-1 sm:px-2 py-2 dark:bg-gray-800 w-screen">
        <div className="flex gap-1 items-center">
          <p className="text-3xl text-white order-first ml-0 mr-auto">
            Shopping list
          </p>
          <div id="pushDownButton" title={connectionStatus} className="">
            <div className="relative active:scale-95 active:duration-75 ">
              <button
                onClick={() => sendJsonMessage({ type: "push_down" })}
                className="text-white rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2.5 mr-3 md:mr-0 transition duration-200 ease-in-out"
                aria-label="Push down checked"
              >
                PD
              </button>
            </div>
          </div>
          <div id="refreshButton" title={connectionStatus} className="">
            <div className="relative active:scale-95 active:duration-75 ">
              <button
                onClick={() => sendJsonMessage({ type: "get" })}
                className="text-white rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2.5 mr-3 md:mr-0 transition duration-200 ease-in-out"
                aria-label="Refresh"
              >
                <svg
                  id="Layer_1"
                  data-name="Layer 1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 119.4 122.88"
                  fill="currentColor"
                >
                  <path d="M83.91,26.34a43.78,43.78,0,0,0-22.68-7,42,42,0,0,0-24.42,7,49.94,49.94,0,0,0-7.46,6.09,42.07,42.07,0,0,0-5.47,54.1A49,49,0,0,0,30,94a41.83,41.83,0,0,0,18.6,10.9,42.77,42.77,0,0,0,21.77.13,47.18,47.18,0,0,0,19.2-9.62,38,38,0,0,0,11.14-16,36.8,36.8,0,0,0,1.64-6.18,38.36,38.36,0,0,0,.61-6.69,8.24,8.24,0,1,1,16.47,0,55.24,55.24,0,0,1-.8,9.53A54.77,54.77,0,0,1,100.26,108a63.62,63.62,0,0,1-25.92,13.1,59.09,59.09,0,0,1-30.1-.25,58.45,58.45,0,0,1-26-15.17,65.94,65.94,0,0,1-8.1-9.86,58.56,58.56,0,0,1,7.54-75,65.68,65.68,0,0,1,9.92-8.09A58.38,58.38,0,0,1,61.55,2.88,60.51,60.51,0,0,1,94.05,13.3l-.47-4.11A8.25,8.25,0,1,1,110,7.32l2.64,22.77h0a8.24,8.24,0,0,1-6.73,9L82.53,43.31a8.23,8.23,0,1,1-2.9-16.21l4.28-.76Z" />
                </svg>
              </button>
              <div
                style={{ backgroundColor: readyColour }}
                className="absolute bottom-0 -right-1 w-4 h-4 mr-1 rounded-full"
              ></div>
            </div>
          </div>
        </div>
      </nav>

      <div
        id="items"
        className="bg-slate-50 pt-2 text-xl w-screen overflow-y-scroll overflow-x-hidden mb-10"
        style={{ maxHeight: "88vh" }}
      >
        <DragDropContext
          onDragEnd={onDragEnd}
          onDragStart={(e) => {
            document.getSelection()?.empty();
            if (
              document.activeElement &&
              document.activeElement.id === "inputelement" &&
              document.activeElement.getAttribute("type") === "text"
            ) {
              // Element is probably the input field of an item
              const el = document.activeElement as HTMLInputElement;
              el.blur();
            }
          }}
        >
          <Droppable droppableId="droppable">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div
                          className="flex flex-row items-center"
                          key={item.id}
                        >
                          <input
                            type="checkbox"
                            className="scale-125 mx-2"
                            id={"cb" + item.id}
                            checked={item.checked}
                            onChange={onCheckboxChange}
                          />
                          <label
                            htmlFor={"cb" + item.id}
                            className="visuallyhidden"
                          >
                            {item.value}
                          </label>
                          <EditText
                            style={{
                              overflowWrap: "break-word",
                            }}
                            className={`${item.checked ? "strike" : ""}`}
                            inputClassName="w-screen mr-1"
                            defaultValue={item.value}
                            id="inputelement"
                            onSave={(value) => {
                              sendJsonMessage({
                                type: "update",
                                data: {
                                  id: item.id,
                                  value: value.value,
                                },
                              });
                            }}
                          />
                          <button
                            className="px-1 mx-2 text-red-500 border bg-grey-100 rounded-md ml-auto"
                            id={"rem" + item.id}
                            onClick={onRemoveclick}
                            aria-label="Remove"
                          >
                            X
                          </button>
                          <hr className="h-1" />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="h-10"></div>
      </div>

      <footer className="fixed bottom-0 w-screen border-t-2 bg-slate-100">
        <form onSubmit={onSubmit} className="flex flex-row">
          <input
            className="w-screen border-grey-200 focus:border-blue-300 focus:outline-none border-2 m-2 p-0.5"
            type="text"
            value={adding}
            id="addItemBox"
            onChange={(e) => {
              setAdding(e.target.value);
            }}
          />
          <input
            className="active:scale-95 active:duration-75 border-2 my-2 px-1 mr-5 border-gray-200 bg-gray-200 rounded-sm transition duration-200 ease hover:bg-gray-300 focus:outline-none focus:shadow-outline"
            type="submit"
            value="Add"
          />
          <label htmlFor="addItemBox" className="visuallyhidden">
            Add new item
          </label>
        </form>
      </footer>
    </div>
  );
}

export default ItemList;
