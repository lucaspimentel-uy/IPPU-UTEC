"""Servidor mínimo de la demo con cola de conexiones grande (§5.167 f). Es una VARIANTE para medir, no el servidor de la presentación.

`python -m http.server` es un ThreadingHTTPServer con `request_queue_size = 5` (el valor de socketserver.TCPServer): Chromium abre
hasta 6 conexiones en paralelo por página y, con la cola llena, Windows contesta RST (ERR_CONNECTION_REFUSED). Esto es lo mismo
—mismo manejador, HTTP/1.0, mismo registro por stderr— salvo la cola: 128.

Uso:  python herramientas/servidor_demo.py [puerto] [--bind 127.0.0.1] [--directory carpeta]
"""
import argparse
import functools
import http.server


class ServidorDemo(http.server.ThreadingHTTPServer):
    request_queue_size = 128          # único cambio respecto de `python -m http.server` (5)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('puerto', nargs='?', type=int, default=5500)
    ap.add_argument('--bind', default='127.0.0.1')
    ap.add_argument('--directory', default='.')
    a = ap.parse_args()
    manejador = functools.partial(http.server.SimpleHTTPRequestHandler, directory=a.directory)
    with ServidorDemo((a.bind, a.puerto), manejador) as srv:
        print(f'Sirviendo {a.directory} en http://{a.bind}:{a.puerto}/ (cola {ServidorDemo.request_queue_size})', flush=True)
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
