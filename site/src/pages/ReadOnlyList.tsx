import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "./ItemList.scss";

type Item = {
  value: string;
  checked: boolean;
  id: string;
};

function ReadOnlyItemList() {
  let { id } = useParams();

  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/export/${id}`)
      .then((res) => res.json())
      .then((data) => setItems(data.data));
  }, [id]);

  function onCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, checked } = e.target;

    setItems(
      items.map((item) => {
        if (item.id === id.slice(2, id.length)) {
          return { ...item, checked };
        }
        return item;
      })
    );
  }

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <nav className="px-1 sm:px-2 py-2 bg-gray-800 w-screen">
        <div className="flex gap-1 items-center">
          <p className="text-3xl text-white order-first ml-0 mr-auto">
            Shopping list
          </p>
        </div>
      </nav>

      <div
        id="items"
        className="bg-slate-50 pt-2 lg:text-xl text-3xl w-screen overflow-y-scroll overflow-x-hidden mb-10"
        style={{ maxHeight: "88vh" }}
      >
        {items.map((item) => (
          <div className="flex flex-row items-center" key={item.id}>
            <input
              type="checkbox"
              className="scale-125 mx-2"
              id={"cb" + item.id}
              checked={item.checked}
              onChange={onCheckboxChange}
            />
            <label htmlFor={"cb" + item.id} className="visuallyhidden">
              {item.value}
            </label>
            <p
              style={{
                overflowWrap: "anywhere",
              }}
              className={`${item.checked ? "strike" : ""}`}
              id="inputelement"
            >
              {item.value}
            </p>
            <hr className="h-1" />
          </div>
        ))}

        <div className="h-10"></div>
      </div>
    </div>
  );
}

export default ReadOnlyItemList;
