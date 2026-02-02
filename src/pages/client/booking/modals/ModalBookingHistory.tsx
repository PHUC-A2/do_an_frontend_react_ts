import { Drawer } from "antd";

interface IProps {
    openModalBookingHistory: boolean;
    setOpenModalBookingHistory: (v: boolean) => void;

}

const ModalBookingHistory = (props: IProps) => {

    const { openModalBookingHistory, setOpenModalBookingHistory } = props;

    return (
        <>
            <Drawer
                title="Lịch sử đặt sân"
                placement="right"
                closable={false}
                // mask={false}
                onClose={() => setOpenModalBookingHistory(false)}
                open={openModalBookingHistory}
            >
                
            </Drawer>
        </>
    )
}

export default ModalBookingHistory;