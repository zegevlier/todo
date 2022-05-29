import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from 'react-use-websocket';

type Todo = {
    value: string;
    checked: boolean;
    id: string;
}

function TodoList() {
    let { id } = useParams();

    const [todos, setTodos] = useState<Todo[]>([]);
    const [adding, setAdding] = useState<string>('');

    const { sendJsonMessage, readyState } = useWebSocket(`${process.env.REACT_APP_WS_URL}/${id}/ws`, {
        shouldReconnect: (closeEvent: CloseEvent) => {
            return closeEvent.code !== 1000;
        },
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onMessage: (message: MessageEvent) => {
            const msg = JSON.parse(message.data);
            if (msg instanceof Array) {
                setTodos(msg);
            } else {
                if (msg.type === 'add') {
                    // For some reason, this sometimes gets triggered twice with the same message.
                    // If that happens, it's probably desynced.
                    if (todos.find(t => t.id === msg.id)) {
                        sendJsonMessage({ type: 'get' })
                    }
                    setTodos([...todos, msg.data]);
                } else if (msg.type === 'remove') {
                    setTodos(todos.filter(todo => todo.id !== msg.data.id));
                } else if (msg.type === 'update') {
                    setTodos(todos.map(todo => todo.id === msg.data.id ? { ...todo, ...msg.data } : todo));
                } else if (msg.type === 'set') {
                    setTodos(msg.data);
                } else {
                    console.error('Unknown message type:', msg.type, msg);
                }
            }
        }
    });

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];


    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/${id}`)
            .then(res => res.json())
            .then(data => setTodos(data));
    }, [id]);

    function onCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { id, checked } = e.target;

        sendJsonMessage({
            type: 'update',
            data: {
                id: id,
                checked: checked
            }
        });
    }

    function onRemoveclick(e: React.MouseEvent<HTMLButtonElement>) {
        const { id } = e.currentTarget;
        sendJsonMessage({
            type: 'remove',
            id: id
        })
    }

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (adding === '') {
            return;
        }
        sendJsonMessage({
            type: 'add',
            value: adding
        });
        setAdding('');
    }

    return (
        <div>
            <p>Status: {connectionStatus}</p>
            <button onClick={() => sendJsonMessage({ 'type': 'get' })}>Refresh</button>
            {todos.map(todo => (
                <div key={todo.id}>
                    {/* Stylized box with text with a checkbox in front of it. */}
                    <label>
                        <input type="checkbox" id={todo.id} checked={todo.checked} onChange={onCheckboxChange} />
                        {todo.value}
                        <button id={todo.id} onClick={onRemoveclick}>X</button>
                    </label>
                </div>
            ))}
            <form onSubmit={onSubmit}>
                <input type="text" value={adding} onChange={(e) => { setAdding(e.target.value) }} />
                <input type="submit" value="Add" />
            </form>
        </div>
    );
}

export default TodoList;