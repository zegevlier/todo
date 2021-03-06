import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { EditText, onSaveProps } from "react-edit-text";

import Helmet from "react-helmet";

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
  const [oldName, setOldName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [isFav, setIsFav] = useState<boolean>(false);

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
          } else if (msg.type === "setname") {
            setName(msg.value);
            setOldName(msg.value);
            let recentItems: RecentType[] = JSON.parse(
              localStorage.getItem("recent") || "[]"
            );
            recentItems = recentItems.map((item) =>
              item.id === id ? { ...item, name: msg.value } : item
            );
            localStorage.setItem("recent", JSON.stringify(recentItems));
            let favItems: RecentType[] = JSON.parse(
              localStorage.getItem("favorites") || "[]"
            );
            favItems = favItems.map((item) =>
              item.id === id ? { ...item, name: msg.value } : item
            );
            localStorage.setItem("favorites", JSON.stringify(favItems));
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
        if (!data.error) {
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
          let favorites: RecentType[] = JSON.parse(
            localStorage.getItem("favorites") || "[]"
          );
          setIsFav(favorites.find((item) => item.id === id) !== undefined);
        } else {
          setError(data.error);
        }
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
    if (typeof navigator.canShare === "function" && navigator.canShare()) {
      navigator.share({
        url: url,
        title: "Checklist",
      });
    }
    setShareLink(url);
  }

  function deleteAll() {
    if (window.confirm("Are you sure you want to delete all items?")) {
      fetch(`${process.env.REACT_APP_API_URL}/${id}/purge`, {
        method: "POST",
      });
    }
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-600 overflow-hidden">
      <Helmet>
        <title>{name}</title>
      </Helmet>
      <nav className="px-1 sm:px-2 py-2 bg-gray-800 w-screen">
        <div className="flex gap-1">
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
          {error.length > 0 ? (
            <p className="md:text-3xl text-xl text-white order-first ml-0 mr-auto">
              {error}
            </p>
          ) : (
            <div className="md:text-3xl text-xl text-white order-first ml-0 mr-0">
              <EditText
                inputClassName="text-black"
                // @ts-ignore The wrong type is being used
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (oldName.length === 0) {
                    setOldName(name);
                  }
                  const value = e.target.value;
                  console.log("changing", value);
                  if (value.length < 25) {
                    setName(value);
                  }
                }}
                onSave={(value) => {
                  if (value.value.length > 25 || value.value.length < 3) {
                    setName(oldName);
                    setOldName("");
                    return;
                  }
                  setOldName("");
                  setName(value.value);
                  fetch(`${process.env.REACT_APP_API_URL}/${id}/setname`, {
                    method: "POST",
                    body: JSON.stringify({
                      name: value.value,
                    }),
                  });

                  console.log(value);
                }}
                value={name}
              ></EditText>
            </div>
          )}

          {error.length === 0 && (
            <div
              className={`order-first text-center items-center justify-center mr-auto ml-0 hover:text-yellow-300 mt-auto mb-auto ${
                isFav ? "text-yellow-300" : "text-white"
              }`}
            >
              <button
                aria-label="Favorite"
                onClick={() => {
                  setIsFav(!isFav);
                  let favorites: RecentType[] = JSON.parse(
                    localStorage.getItem("favorites") || "[]"
                  );
                  if (isFav) {
                    favorites = favorites.filter((f) => f.id !== id);
                  } else {
                    if (id && name) {
                      favorites.push({
                        id: id,
                        name: name,
                        date: new Date().toString(),
                      });
                    }
                  }
                  localStorage.setItem("favorites", JSON.stringify(favorites));
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill={isFav ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
            </div>
          )}

          {error.length === 0 && (
            <div id="purgeButton" title="Delete all" className="">
              <div className="relative active:scale-95 active:duration-75 ">
                <button
                  onClick={() => deleteAll()}
                  className="text-white rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2.5 mr-3 md:mr-0 transition duration-200 ease-in-out"
                  aria-label="Purge"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {error.length === 0 && (
            <div id="shareButton" className="">
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
                        fetch(`${process.env.REACT_APP_API_URL}/${id}/clone`, {
                          method: "POST",
                        })
                          .then((res) => res.json())
                          .then((data) => {
                            shareOrCopy(
                              new URL(window.location.href).origin +
                                "/" +
                                data.id
                            );
                          });
                      }}
                    >
                      Clone
                    </button>
                  </li>
                  <li>
                    <button
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white w-full text-left"
                      onClick={() => {
                        fetch(`${process.env.REACT_APP_API_URL}/${id}/export`, {
                          method: "POST",
                        })
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
                      Read only copy
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {error.length === 0 && (
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
                    className="absolute bottom-0 sm:-right-1 right-2 w-4 h-4 mr-1 rounded-full"
                  ></div>
                </button>
              </div>
            </div>
          )}
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
                    onClick={() => {
                      (
                        document.getElementById("link") as HTMLInputElement
                      )?.select();
                    }}
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
      {error.length > 0 ? (
        <div className="h-20 text-2xl items-end flex justify-center w-screen text-center">
          <p>
            This list doesn't couldn't be loaded, please go back{" "}
            <a className="underline" href="/">
              home
            </a>
            .
          </p>
        </div>
      ) : items.length > 0 ? (
        <div
          id="items"
          className="bg-slate-50 dark:bg-slate-600 dark:text-white pt-2 lg:text-xl text-3xl w-screen overflow-y-auto overflow-x-hidden mb-10"
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
                            className="flex flex-row items-center py-0.5"
                            key={item.id}
                          >
                            <input
                              type="checkbox"
                              className="scale-125 mx-2 cursor-pointer"
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
                                overflowWrap: "anywhere",
                              }}
                              className={`cursor-text ${
                                item.checked ? "strike" : ""
                              }`}
                              inputClassName="w-screen mr-1 text-black"
                              defaultValue={item.value}
                              id="inputelement"
                              onSave={(v) => onEditBoxSave(v, item.id)}
                            />
                            <button
                              className="px-1 mx-2 text-red-500 rounded-md ml-auto hover:text-red-600 dark:text-red-600 hover:dark:text-red-500"
                              id={"rem" + item.id}
                              onClick={onRemoveclick}
                              aria-label="Remove"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
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
        <div className="h-20 text-2xl items-end flex justify-center w-screen text-center dark:text-white">
          <p>No items, create your first below!</p>
        </div>
      )}

      {error ? (
        <div></div>
      ) : (
        <footer className="fixed bottom-0 w-screen bg-slate-100 dark:bg-slate-700 dark:border-gray-800 text-lg">
          <form onSubmit={onSubmit} className="flex flex-row">
            <input
              className="w-screen border-gray-200 focus:border-blue-500 focus:outline-none border-2 m-2 p-0.5 dark:bg-slate-400 dark:border-gray-800 dark:focus:border-blue-500"
              type="text"
              value={adding}
              id="addItemBox"
              maxLength={250}
              autoFocus
              onChange={(e) => {
                setAdding(e.target.value);
              }}
            />
            <button
              className="active:scale-95 active:duration-75 my-2 px-1 mr-3 text-white bg-blue-600 rounded-sm transition duration-200 ease hover:bg-blue-700 focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Add
            </button>
            <label htmlFor="addItemBox" className="visuallyhidden">
              Add new item
            </label>
          </form>
        </footer>
      )}
    </div>
  );
}

export default ItemList;
