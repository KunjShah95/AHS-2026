
import utils
from core import engine

def main():
    data = utils.load_data()
    engine.process(data)

if __name__ == "__main__":
    main()
