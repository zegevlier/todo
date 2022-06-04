import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { EditText, onSaveProps } from "react-edit-text";

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
  const { id } = useParams();

  const [items, setItems] = useState<Item[]>([]);
  const [adding, setAdding] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const [shareDropdownShown, setShareDropdownShown] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string>("");

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
    if (!id) {
      setError("No ID specified");
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name);
        setItems(data.items);
        let recentItems: RecentType[] = JSON.parse(
          localStorage.getItem("recent") || "[]"
        );
        recentItems = recentItems.filter((item) => item.id !== id);
        recentItems.unshift({
          id,
          name: data.name,
          date: new Date().toString(),
        });
        recentItems = recentItems.slice(0, 10);
        localStorage.setItem("recent", JSON.stringify(recentItems));
      })
      .catch((err) => {
        setError("404 list not found");
      });
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

  function onEditBoxSave(value: onSaveProps, id: string) {
    if (value.value.length > 250) {
      // Don't allow it to be sent to the server
      // Set it back to the old value

      console.log("too long");
      return;
    }
    if (value.value.length === 0) {
      sendJsonMessage({
        type: "remove",
        id: id,
      });
    } else {
      sendJsonMessage({
        type: "update",
        data: {
          id: id,
          value: value.value,
        },
      });
    }
  }

  function shareOrCopy(url: string) {
    setShareDropdownShown(false);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    if (navigator.share && navigator.canShare()) {
      navigator.share({
        url: url,
        title: "List",
      });
    }
    setShareLink(url);
  }

  return error ? (
    <div>{error}</div>
  ) : (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <nav className="px-1 sm:px-2 py-2 bg-gray-800 w-screen">
        <div className="flex gap-1 items-center">
          <button
            className="order-first text-white rounded-md pr-1 py-2.5"
            aria-label="Go back home"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
          </button>
          <p className="text-3xl text-white order-first ml-0 mr-auto">{name}</p>
          <div id="shareButton" title={connectionStatus} className="">
            <div className="relative active:scale-95 active:duration-75 ">
              <button
                className="text-white rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2.5 mr-3 md:mr-0 transition duration-200 ease-in-out"
                aria-label="Open share dropdown"
                onClick={() => setShareDropdownShown(!shareDropdownShown)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </div>
            <div
              id="shareDropdown"
              className={`${
                shareDropdownShown ? "" : "hidden"
              } origin-top-right absolute right-0 mt-2 w-40 rounded-bl-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 divide-gray-100 dark:bg-gray-700`}
            >
              <ul
                className="py-1 text-sm text-gray-700 dark:text-gray-200"
                aria-labelledby="dropdownDefault"
              >
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white w-full text-left"
                    onClick={() => {
                      shareOrCopy(window.location.href);
                    }}
                  >
                    Live edit
                  </button>
                </li>
                <li>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white w-full text-left"
                    onClick={() => {
                      fetch(`${process.env.REACT_APP_API_URL}/${id}/export`)
                        .then((res) => res.json())
                        .then((data) => {
                          shareOrCopy(
                            new URL(window.location.href).origin +
                              "/r/" +
                              data.id
                          );
                        });
                    }}
                  >
                    Read only
                  </button>
                </li>
              </ul>
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
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <div
                  style={{ backgroundColor: readyColour }}
                  className="absolute bottom-0 -right-1 w-4 h-4 mr-1 rounded-full"
                ></div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        style={{
          backgroundColor: "#000",
          opacity: 0.7,
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: "10",
          animation: `fadein 200ms ease-in-out forwards`,
        }}
        className={`${shareLink ? "" : "hidden"}`}
      ></div>

      <div
        id="share-modal"
        tabIndex={-1}
        aria-hidden="true"
        className={`${
          shareLink ? "" : "hidden"
        } overflow-y-auto overflow-x-hidden fixed z-50 w-full md:inset-0 md:h-full flex justify-center items-start md:pt-40`}
      >
        <div className="relative p-4 w-full max-w-md h-full md:h-auto content-center">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <button
              type="button"
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
              data-modal-toggle="authentication-modal"
              onClick={() => {
                setShareLink("");
              }}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>

            <div className="py-6 px-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">
                Copied your share link!
              </h3>
              <div className="space-y-3">
                <div>
                  <input
                    name="link"
                    id="link"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                    placeholder=""
                    readOnly
                    value={shareLink}
                  />
                </div>
                <button
                  className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={() => {
                    setShareLink("");
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div
          id="items"
          className="bg-slate-50 pt-2 lg:text-xl text-3xl w-screen overflow-y-scroll overflow-x-hidden mb-10"
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
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
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
                              onSave={(v) => onEditBoxSave(v, item.id)}
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
      ) : (
        <div className="h-20 text-2xl items-end flex justify-center w-screen text-center">
          <p>No items, create your first below!</p>
        </div>
      )}

      <footer className="fixed bottom-0 w-screen border-t-2 bg-slate-100">
        <form onSubmit={onSubmit} className="flex flex-row">
          <input
            className="w-screen border-grey-200 focus:border-blue-300 focus:outline-none border-2 m-2 p-0.5"
            type="text"
            value={adding}
            id="addItemBox"
            maxLength={250}
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
