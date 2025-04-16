import { useContext } from "react"
import { userContext } from "../contexts/userContext"

export default function Home() {

    const user = useContext(userContext)?.user;

    return (
        <div>
            <button onClick={() => console.log(user)}>log home</button>
        </div>
    )
}