import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

const HomePage = () => {
    return (
        <>
            <hr style={{ color: "red" }} />
            <h1>Home page</h1>
            <Button variant="outline-dark" onClick={() => {
                toast.success("Hello")
            }}>Click</Button>
        </>
    )
};

export default HomePage;