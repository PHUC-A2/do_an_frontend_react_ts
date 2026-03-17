import { InputNumber, Spin, Switch } from "antd";
import { useEffect, useState } from "react";
import { getPublicEquipments } from "../../../../config/Api";
import type { IEquipment } from "../../../../types/equipment";
import type { ShirtOptionEnum } from "../../../../types/booking";

interface IProps {
    isAuthenticated: boolean;
    shirtOption: ShirtOptionEnum | undefined;
    ballQty: number;
    setBallQty: (v: number) => void;
    borrowShirt: boolean;
    setBorrowShirt: (v: boolean) => void;
    shirtQty: number;
    setShirtQty: (v: number) => void;
    /** Nếu truyền vào thì dùng luôn, không fetch lại */
    equipments?: IEquipment[];
}

const EquipmentBorrowSection = ({
    isAuthenticated,
    shirtOption,
    ballQty,
    setBallQty,
    borrowShirt,
    setBorrowShirt,
    shirtQty,
    setShirtQty,
    equipments: equipmentsProp,
}: IProps) => {
    const [fetchedEquipments, setFetchedEquipments] = useState<IEquipment[]>([]);
    const [equipLoading, setEquipLoading] = useState(false);

    useEffect(() => {
        if (equipmentsProp !== undefined) return; // dùng prop, không fetch
        if (!isAuthenticated) return;
        setEquipLoading(true);
        getPublicEquipments()
            .then(res => { if (res.data.statusCode === 200) setFetchedEquipments(res.data.data ?? []); })
            .catch(() => { })
            .finally(() => setEquipLoading(false));
    }, [isAuthenticated, equipmentsProp]);

    const equipments = equipmentsProp ?? fetchedEquipments;

    const ballEquipment = equipments.find(e =>
        e.name.toLowerCase().includes("bóng") || e.name.toLowerCase().includes("ball")
    );
    const shirtEquipment = equipments.find(e =>
        e.name.toLowerCase().includes("áo") || e.name.toLowerCase().includes("shirt")
    );

    if (!isAuthenticated) return null;

    return (
        <div className="bk__equipment-section">
            <p className="bk__section-title">⚽ Thiết bị mượn</p>

            {equipLoading ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}><Spin size="small" /></div>
            ) : (
                <>
                    {/* Bóng — luôn hiện, mặc định 1 */}
                    <div className="bk__equip-row">
                        <span className="bk__equip-label">
                            ⚽ Bóng
                            {ballEquipment && (
                                <span className="bk__equip-avail"> (còn {ballEquipment.availableQuantity})</span>
                            )}
                        </span>
                        <InputNumber
                            className="bk__equip-qty"
                            min={1}
                            max={ballEquipment?.availableQuantity ?? 99}
                            value={ballQty}
                            onChange={val => setBallQty(val ?? 1)}
                            disabled={!ballEquipment}
                        />
                        {!ballEquipment && <span className="bk__equip-unavail">Hết hàng</span>}
                    </div>

                    {/* Áo — chỉ hiện khi chọn "Có lấy áo" */}
                    {shirtOption === "WITH_PITCH_SHIRT" && (
                        <div className="bk__equip-row">
                            <span className="bk__equip-label">
                                👕 Mượn áo
                                {shirtEquipment && (
                                    <span className="bk__equip-avail"> (còn {shirtEquipment.availableQuantity})</span>
                                )}
                            </span>
                            <Switch
                                size="small"
                                checked={borrowShirt}
                                onChange={v => setBorrowShirt(v)}
                                disabled={!shirtEquipment}
                            />
                            {borrowShirt && shirtEquipment && (
                                <InputNumber
                                    className="bk__equip-qty"
                                    min={1}
                                    max={shirtEquipment.availableQuantity}
                                    value={shirtQty}
                                    onChange={val => setShirtQty(val ?? 1)}
                                />
                            )}
                            {!shirtEquipment && <span className="bk__equip-unavail">Hết hàng</span>}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EquipmentBorrowSection;

// Helper để build danh sách borrow tasks sau khi booking/update thành công
export const buildBorrowTasks = async (
    bookingId: number,
    equipments: IEquipment[],
    ballQty: number,
    borrowShirt: boolean,
    shirtQty: number,
    borrowFn: (data: { bookingId: number; equipmentId: number; quantity: number }) => Promise<any>
) => {
    const ballEquipment = equipments.find(e =>
        e.name.toLowerCase().includes("bóng") || e.name.toLowerCase().includes("ball")
    );
    const shirtEquipment = equipments.find(e =>
        e.name.toLowerCase().includes("áo") || e.name.toLowerCase().includes("shirt")
    );

    const tasks: Promise<any>[] = [];
    if (ballEquipment && ballQty > 0) {
        tasks.push(borrowFn({ bookingId, equipmentId: ballEquipment.id, quantity: ballQty }).catch(() => { }));
    }
    if (borrowShirt && shirtEquipment && shirtQty > 0) {
        tasks.push(borrowFn({ bookingId, equipmentId: shirtEquipment.id, quantity: shirtQty }).catch(() => { }));
    }
    if (tasks.length > 0) await Promise.all(tasks);
};
