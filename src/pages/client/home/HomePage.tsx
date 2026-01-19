import { Button } from "react-bootstrap";
// import { toast } from "react-toastify";

const HomePage = () => {
    // const onClick = () => {
    //     window.open(
    //         `https://m.me/${import.meta.env.VITE_PAGE_ID}`,
    //         "_blank"
    //     );
    // };
    return (
        <>
            <hr style={{ color: "red" }} />
            <h1>Home page</h1>
            <Button variant="outline-dark" onClick={() => {
                // toast.success("Hello")
                window.open(
                    "https://www.google.com/maps/dir/?api=1&destination=21.3095582,103.9401061",
                    "_blank"
                );
            }}>Click</Button>
        </>
    )
};

export default HomePage;