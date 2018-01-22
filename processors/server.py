import socket
import select
from Processor import Processor

host = ''
port = 12800

# AF_INET for INET ADDRESS
# SOCK_STREAM for TCP protocol
mainSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
mainSocket.bind((host, port))
mainSocket.listen(5)
print("Server listen port {}".format(port))

processor = Processor()

server_run = True
connectedClients = []
while server_run:
    # Verify each 0.05 (max) sec, if someone ask for connect (he sent a connection packet)
    askedConnections, wList, xList = select.select([mainSocket], [], [], 0.05)
    for connection in askedConnections:
        clientSocket, clientInfos = connection.accept()
        # Add the new accepted client socket to our connected clients
        connectedClients.append(clientSocket)
        print("One client connected")

    clientsToListen = []
    # Verify each 0.05 (max) sec, if a connected client is enabled to read (he sent a msg)
    try:
        clientsToListen, wList, xList = select.select(connectedClients, [], [], 0.05)
    except select.error:
        pass
    else:
        # Get clientSocket which have sent a msg one by one
        for clientSocket in clientsToListen:
            recvMsg = clientSocket.recv(1024)
            recvMsg = recvMsg.decode()
            if recvMsg == "fin":
                clientSocket.close()
                clientsToListen.remove(clientSocket)
                connectedClients.remove(clientSocket)
                print("One client disconnected")
            else:
                processor.peel(recvMsg)
                r = processor.execute()
                clientSocket.send('commands/' + r)

print("Server close")
for clientSocket in connectedClients:
    clientSocket.close()
mainSocket.close()