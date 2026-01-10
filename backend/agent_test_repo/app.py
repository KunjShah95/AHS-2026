
import utils
from core import engine

def main():
    print("Starting App")
    data = utils.fetch_data()
    engine.run(data)

if __name__ == "__main__":
    main()
