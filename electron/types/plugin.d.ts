interface AtujiiClient {
  addGridItemButton: (options: {
    buttonText: string;
    buttonIndex: number;
  }, callback: (clickedImage: any, client: AtujiiClient) => void) => void;
  
  addToolBarItem: (options: {
    buttonText: string;
    buttonIndex: number;
  }, callback: (selectedImage: any, client: AtujiiClient) => void) => void;
}

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  setup?: (client: AtujiiClient) => void;
} 