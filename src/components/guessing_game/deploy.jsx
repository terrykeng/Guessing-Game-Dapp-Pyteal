import React, {useState} from "react";
import {toast} from "react-toastify";
import Loader from "../utils/Loader";
import {NotificationError, NotificationSuccess} from "../utils/Notifications";
import PropTypes from "prop-types";
import {Button, FloatingLabel, Form, Modal} from "react-bootstrap";
import {Deploygame, Connectgame} from "../../utils/guessingame";
import {useNavigate} from 'react-router-dom';

const Deploy = ({address, fetchBalance}) => {
    const [isconnectedstatus, setstatus] = useState("");
    const [appid, setAppid] = useState(0);

    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClose = () => setShow1(false);
    const handleClose2 = () => setShow2(false);
    const handleShow = () => setShow1(true);
    const handleShow2 = () => setShow2(true);

    const navigate = useNavigate()

    if (loading) {
	    return <Loader/>;
	}
    return (
        <>

            <div style={{ display:"flex" , justifycontent:"center", alignitem:"center"}}>
            <Button 
                     onClick={handleShow}
                    variant="dark"
                    className="rounded-pill px-0"
                    style={{ margin: "10px auto", width: "50%"}}
            >Deploy contract</Button>
            </div>
            
            <div style={{ display:"flex" , justifycontent:"center", alignitem:"center"}}>
            <Button 
                    onClick={handleShow2}
                    variant="dark"
                    className="rounded-pill px-0"
                    style={{ margin: "10px auto", width: "50%"}}
            >Connect to contract</Button>
            </div>
            <Modal show={show1} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Deploy or Connect</Modal.Title>
                </Modal.Header>
                <Form>
                    <Modal.Body>
                        <FloatingLabel
                            controlId="inputName"
                            label="Enter Yes to Deploy"
                            className="mb-3"
                        >
                            <Form.Control
                                type="text"
                                onChange={(e) => {
                                    setstatus(e.target.value)
                                }}
                                placeholder="Enter Status"
                            />
                        </FloatingLabel>
                    </Modal.Body>
                </Form>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <div>
                    <Button
                        variant="dark"
                        onClick={() => {
                            setLoading(true);
                            Deploygame(address)
                                .then(() => {
                                    toast(<NotificationSuccess text="Game started sucessfully."/>);
                                    fetchBalance(address);
                                    navigate('/challenge')
                                })
                                .catch(error => {
                                    console.log(error);
                                    toast(<NotificationError text="Starting game wasn't sucessful."/>);
                                    setLoading(false);
                                })
                            handleClose();
                            
                        }}
                    >
                        Enter
                    </Button>
                    </div>
                </Modal.Footer>
            </Modal>
            <Modal show={show2} onHide={handleClose2} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Enter App-id</Modal.Title>
                </Modal.Header>
                <Form>
                    <Modal.Body>
                        <FloatingLabel
                            controlId="inputName"
                            label="Enter App id"
                            className="mb-3"
                        >
                            <Form.Control
                                type="text"
                                onChange={(e) => {
                                    setAppid(e.target.value)
                                }}
                                placeholder="Enter Appid"
                            />
                        </FloatingLabel>
                    </Modal.Body>
                </Form>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <div>
                    <Button
                        variant="dark"
                        onClick={() => {
                            let data = {isconnectedstatus, appid}
                            setLoading(true);
                            Connectgame(address, data)
                            .then(() => {
                                toast(<NotificationSuccess text="Game started sucessfully."/>);
                                fetchBalance(address);
                                navigate('/accept_challenge')
                            })
                            .catch(error => {
                                console.log(error);
                                toast(<NotificationError text="Starting game wasn't sucessful."/>);
                                setLoading(false);
                            })
                            handleClose2();

                        }}
                    >
                        Enter
                    </Button>
                    </div>
                </Modal.Footer>
            </Modal>


           


        </>
    );
};

Deploy.propTypes = {
    address: PropTypes.string.isRequired,
    fetchBalance: PropTypes.func.isRequired
};

export default Deploy;

